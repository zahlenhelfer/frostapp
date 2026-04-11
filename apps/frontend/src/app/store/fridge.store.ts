import { inject, effect, Injector, runInInjectionContext } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of, Observable, from } from 'rxjs';
import type { Fridge, FrostItem, CreateFridgeRequest, UpdateFridgeRequest, CreateItemRequest, UpdateItemRequest, UpdateShelfRequest } from '@frostapp/shared';
import { FridgeApiService } from '../services/fridge-api.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NetworkStatusService } from '../services/network-status.service';
import { SyncService } from '../services/sync.service';
import type { PendingOperationType } from '../services/offline-storage.service';

interface FridgeState {
  fridges: Fridge[];
  selectedFridgeId: string | null;
  selectedShelfId: string | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean;
}

const initialState: FridgeState = {
  fridges: [],
  selectedFridgeId: null,
  selectedShelfId: null,
  isLoading: false,
  error: null,
  isOffline: false,
};

export const FridgeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedFridge: computed(() => {
      const id = store.selectedFridgeId();
      return id ? store.fridges().find((f) => f.id === id) || null : null;
    }),
    selectedShelf: computed(() => {
      const fridge = store
        .fridges()
        .find((f) => f.id === store.selectedFridgeId());
      const shelfId = store.selectedShelfId();
      return shelfId
        ? fridge?.shelves.find((s) => s.id === shelfId) || null
        : null;
    }),
    fridgeCount: computed(() => store.fridges().length),
    totalItemCount: computed(() =>
      store
        .fridges()
        .reduce(
          (total, fridge) =>
            total +
            fridge.shelves.reduce(
              (shelfTotal, shelf) => shelfTotal + shelf.items.length,
              0
            ),
          0
        )
    ),
  })),
  withMethods((store, 
    api = inject(FridgeApiService),
    offlineStorage = inject(OfflineStorageService),
    networkStatus = inject(NetworkStatusService),
    syncService = inject(SyncService),
    injector = inject(Injector)
  ) => ({
    // Initialize and listen for network status
    init(): void {
      // Subscribe to network status using effect in injection context
      runInInjectionContext(injector, () => {
        effect(() => {
          const offline = networkStatus.offline();
          patchState(store, { isOffline: offline });
        });
      });
    },

    // Load all fridges (with offline fallback)
    loadFridges: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          if (networkStatus.isOnlineNow) {
            // Online: fetch from API and cache locally
            return api.getAllFridges().pipe(
              tap((fridges) => {
                // Save to IndexedDB for offline use
                offlineStorage.saveFridges(fridges);
                patchState(store, { fridges, isLoading: false, isOffline: false });
              }),
              catchError((err) => {
                // On API error, try to load from cache
                return from(offlineStorage.getFridges()).pipe(
                  tap((cachedFridges) => {
                    if (cachedFridges.length > 0) {
                      patchState(store, { 
                        fridges: cachedFridges, 
                        isLoading: false,
                        error: 'Using offline data. Some changes may not be saved.'
                      });
                    } else {
                      patchState(store, { 
                        error: err.message || 'Failed to load fridges',
                        isLoading: false 
                      });
                    }
                  })
                );
              })
            );
          } else {
            // Offline: load from cache
            return from(offlineStorage.getFridges()).pipe(
              tap((cachedFridges) => {
                patchState(store, { 
                  fridges: cachedFridges, 
                  isLoading: false, 
                  isOffline: true 
                });
              })
            );
          }
        })
      )
    ),

    // Create a new fridge (with offline support)
    createFridge: rxMethod<CreateFridgeRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((data) => {
          // Generate temporary ID for offline use
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const newFridge: Fridge = {
            id: tempId,
            name: data.name,
            shelfCount: data.shelfCount,
            shelves: Array.from({ length: data.shelfCount }, (_, i) => ({
              id: `temp-shelf-${Date.now()}-${i}`,
              name: `Fach ${i + 1}`,
              items: [],
            })),
          };

          // Optimistically update UI
          patchState(store, (state) => ({
            fridges: [...state.fridges, newFridge],
            isLoading: false,
          }));

          // Save to offline storage
          offlineStorage.saveFridge(newFridge);

          if (networkStatus.isOnlineNow) {
            // Online: call API
            return api.createFridge(data).pipe(
              tap((createdFridge) => {
                // Replace temp fridge with real one
                patchState(store, (state) => ({
                  fridges: state.fridges.map((f) =>
                    f.id === tempId ? createdFridge : f
                  ),
                }));
                // Update cache
                offlineStorage.deleteFridge(tempId);
                offlineStorage.saveFridge(createdFridge);
              }),
              catchError((err) => {
                // Queue for later sync
                syncService.queueOperation({
                  type: 'CREATE_FRIDGE' as PendingOperationType,
                  timestamp: new Date().toISOString(),
                  data,
                  retryCount: 0,
                });
                patchState(store, { 
                  error: 'Saved offline. Will sync when online.',
                  isOffline: true 
                });
                return of(null);
              })
            );
          } else {
            // Offline: queue for sync
            return from(syncService.queueOperation({
              type: 'CREATE_FRIDGE' as PendingOperationType,
              timestamp: new Date().toISOString(),
              data,
              retryCount: 0,
            })).pipe(
              tap(() => {
                patchState(store, { 
                  error: 'Saved offline. Will sync when online.',
                  isOffline: true 
                });
              })
            );
          }
        })
      )
    ),

    // Update a fridge (with offline support)
    updateFridge: rxMethod<{ id: string; updates: UpdateFridgeRequest }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ id, updates }) => {
          // Optimistically update UI
          patchState(store, (state) => ({
            fridges: state.fridges.map((fridge) =>
              fridge.id === id ? { ...fridge, ...updates } : fridge
            ),
            isLoading: false,
          }));

          // Update cache
          const updatedFridge = store.fridges().find((f) => f.id === id);
          if (updatedFridge) {
            offlineStorage.saveFridge(updatedFridge);
          }

          if (networkStatus.isOnlineNow) {
            return api.updateFridge(id, updates).pipe(
              tap((result) => {
                offlineStorage.saveFridge(result);
              }),
              catchError(() => {
                syncService.queueOperation({
                  type: 'UPDATE_FRIDGE' as PendingOperationType,
                  timestamp: new Date().toISOString(),
                  data: { id, ...updates },
                  retryCount: 0,
                });
                return of(null);
              })
            );
          } else {
            return from(syncService.queueOperation({
              type: 'UPDATE_FRIDGE' as PendingOperationType,
              timestamp: new Date().toISOString(),
              data: { id, ...updates },
              retryCount: 0,
            }));
          }
        })
      )
    ),

    // Delete a fridge (with offline support)
    deleteFridge: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((id) => {
          // Optimistically remove from UI
          patchState(store, (state) => ({
            fridges: state.fridges.filter((f) => f.id !== id),
            selectedFridgeId: state.selectedFridgeId === id ? null : state.selectedFridgeId,
            isLoading: false,
          }));

          // Remove from cache
          offlineStorage.deleteFridge(id);

          if (networkStatus.isOnlineNow) {
            return api.deleteFridge(id).pipe(
              catchError(() => {
                syncService.queueOperation({
                  type: 'DELETE_FRIDGE' as PendingOperationType,
                  timestamp: new Date().toISOString(),
                  data: { id },
                  retryCount: 0,
                });
                return of(null);
              })
            );
          } else {
            return from(syncService.queueOperation({
              type: 'DELETE_FRIDGE' as PendingOperationType,
              timestamp: new Date().toISOString(),
              data: { id },
              retryCount: 0,
            }));
          }
        })
      )
    ),

    // Select fridge
    selectFridge(id: string | null): void {
      patchState(store, { selectedFridgeId: id, selectedShelfId: null });
    },

    // Select shelf
    selectShelf(id: string | null): void {
      patchState(store, { selectedShelfId: id });
    },

    // Add frost item (with offline support)
    addFrostItem: rxMethod<{ fridgeId: string; shelfId: string; name: string; depositDate: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ fridgeId, shelfId, name, depositDate }) => {
          const tempItemId = `temp-item-${Date.now()}`;
          
          // Optimistically update UI
          patchState(store, (state) => ({
            fridges: state.fridges.map((fridge) => {
              if (fridge.id !== fridgeId) return fridge;
              return {
                ...fridge,
                shelves: fridge.shelves.map((shelf) => {
                  if (shelf.id !== shelfId) return shelf;
                  return {
                    ...shelf,
                    items: [...shelf.items, {
                      id: tempItemId,
                      name,
                      depositDate,
                    }],
                  };
                }),
              };
            }),
            isLoading: false,
          }));

          // Update cache
          const fridge = store.fridges().find((f) => f.id === fridgeId);
          if (fridge) {
            offlineStorage.saveFridge(fridge);
          }

          if (networkStatus.isOnlineNow) {
            return api.addItem(fridgeId, shelfId, { name, depositDate }).pipe(
              tap((newItem) => {
                // Replace temp item with real one
                patchState(store, (state) => ({
                  fridges: state.fridges.map((fridge) => {
                    if (fridge.id !== fridgeId) return fridge;
                    return {
                      ...fridge,
                      shelves: fridge.shelves.map((shelf) => {
                        if (shelf.id !== shelfId) return shelf;
                        return {
                          ...shelf,
                          items: shelf.items.map((item) =>
                            item.id === tempItemId ? newItem : item
                          ),
                        };
                      }),
                    };
                  }),
                }));
              }),
              catchError(() => {
                syncService.queueOperation({
                  type: 'ADD_ITEM' as PendingOperationType,
                  timestamp: new Date().toISOString(),
                  data: { fridgeId, shelfId, name, depositDate },
                  retryCount: 0,
                });
                return of(null);
              })
            );
          } else {
            return from(syncService.queueOperation({
              type: 'ADD_ITEM' as PendingOperationType,
              timestamp: new Date().toISOString(),
              data: { fridgeId, shelfId, name, depositDate },
              retryCount: 0,
            }));
          }
        })
      )
    ),

    // Update frost item (with offline support)
    updateFrostItem: rxMethod<{ fridgeId: string; shelfId: string; itemId: string; updates: Partial<FrostItem> }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ fridgeId, shelfId, itemId, updates }) => {
          // Optimistically update UI
          patchState(store, (state) => ({
            fridges: state.fridges.map((fridge) => {
              if (fridge.id !== fridgeId) return fridge;
              return {
                ...fridge,
                shelves: fridge.shelves.map((shelf) => {
                  if (shelf.id !== shelfId) return shelf;
                  return {
                    ...shelf,
                    items: shelf.items.map((item) =>
                      item.id === itemId ? { ...item, ...updates } : item
                    ),
                  };
                }),
              };
            }),
            isLoading: false,
          }));

          // Update cache
          const fridge = store.fridges().find((f) => f.id === fridgeId);
          if (fridge) {
            offlineStorage.saveFridge(fridge);
          }

          if (networkStatus.isOnlineNow) {
            return api.updateItem(fridgeId, shelfId, itemId, updates).pipe(
              catchError(() => {
                syncService.queueOperation({
                  type: 'UPDATE_ITEM' as PendingOperationType,
                  timestamp: new Date().toISOString(),
                  data: { fridgeId, shelfId, itemId, ...updates },
                  retryCount: 0,
                });
                return of(null);
              })
            );
          } else {
            return from(syncService.queueOperation({
              type: 'UPDATE_ITEM' as PendingOperationType,
              timestamp: new Date().toISOString(),
              data: { fridgeId, shelfId, itemId, ...updates },
              retryCount: 0,
            }));
          }
        })
      )
    ),

    // Delete frost item (with offline support)
    deleteFrostItem: rxMethod<{ fridgeId: string; shelfId: string; itemId: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ fridgeId, shelfId, itemId }) => {
          // Optimistically remove from UI
          patchState(store, (state) => ({
            fridges: state.fridges.map((fridge) => {
              if (fridge.id !== fridgeId) return fridge;
              return {
                ...fridge,
                shelves: fridge.shelves.map((shelf) => {
                  if (shelf.id !== shelfId) return shelf;
                  return {
                    ...shelf,
                    items: shelf.items.filter((item) => item.id !== itemId),
                  };
                }),
              };
            }),
            isLoading: false,
          }));

          // Update cache
          const fridge = store.fridges().find((f) => f.id === fridgeId);
          if (fridge) {
            offlineStorage.saveFridge(fridge);
          }

          if (networkStatus.isOnlineNow) {
            return api.deleteItem(fridgeId, shelfId, itemId).pipe(
              catchError(() => {
                syncService.queueOperation({
                  type: 'DELETE_ITEM' as PendingOperationType,
                  timestamp: new Date().toISOString(),
                  data: { fridgeId, shelfId, itemId },
                  retryCount: 0,
                });
                return of(null);
              })
            );
          } else {
            return from(syncService.queueOperation({
              type: 'DELETE_ITEM' as PendingOperationType,
              timestamp: new Date().toISOString(),
              data: { fridgeId, shelfId, itemId },
              retryCount: 0,
            }));
          }
        })
      )
    ),
  }))
);
