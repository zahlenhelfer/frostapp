import { Injectable, inject, signal, effect } from '@angular/core';
import { Subject, from, of } from 'rxjs';
import { concatMap, delay, catchError, tap } from 'rxjs/operators';
import { OfflineStorageService, type PendingOperation } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { FridgeApiService } from './fridge-api.service';

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private readonly offlineStorage = inject(OfflineStorageService);
  private readonly networkStatus = inject(NetworkStatusService);
  private readonly api = inject(FridgeApiService);

  private readonly syncTrigger = new Subject<void>();

  readonly syncStatus = signal<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncAt: null,
    error: null,
  });

  constructor() {
    // Auto-sync when coming back online
    effect(() => {
      const online = this.networkStatus.online();
      if (online) {
        this.triggerSync();
      }
    });

    // Process sync queue
    this.syncTrigger
      .pipe(
        tap(() => this.syncStatus.update((s) => ({ ...s, isSyncing: true, error: null }))),
        concatMap(() => from(this.processSyncQueue())),
        catchError((err) => {
          this.syncStatus.update((s) => ({ ...s, error: err.message }));
          return of(null);
        }),
        tap(() => this.syncStatus.update((s) => ({ ...s, isSyncing: false })))
      )
      .subscribe();

    // Initialize
    this.updateSyncStatus();
  }

  async triggerSync(): Promise<void> {
    if (!this.networkStatus.isOnlineNow) {
      return;
    }
    this.syncTrigger.next();
  }

  async queueOperation(operation: Omit<PendingOperation, 'id'>): Promise<void> {
    await this.offlineStorage.addPendingOperation(operation);
    await this.updateSyncStatus();

    // Try to sync immediately if online
    if (this.networkStatus.isOnlineNow) {
      this.triggerSync();
    }
  }

  private async processSyncQueue(): Promise<void> {
    const operations = await this.offlineStorage.getPendingOperations();

    if (operations.length === 0) {
      await this.updateSyncStatus();
      return;
    }

    this.syncStatus.update((s) => ({ ...s, pendingCount: operations.length }));

    for (const op of operations) {
      try {
        await this.executeOperation(op);
        await this.offlineStorage.removePendingOperation(op.id!);
      } catch (err) {
        console.error('Sync failed for operation:', op, err);
        const newRetryCount = (op.retryCount || 0) + 1;
        if (newRetryCount < 3) {
          await this.offlineStorage.updatePendingOperationRetry(op.id!, newRetryCount);
        } else {
          // Remove failed operations after 3 retries
          await this.offlineStorage.removePendingOperation(op.id!);
        }
      }
    }

    await this.offlineStorage.updateLastSync();
    await this.updateSyncStatus();
  }

  private async executeOperation(op: PendingOperation): Promise<void> {
    const data = op.data as Record<string, unknown>;

    switch (op.type) {
      case 'CREATE_FRIDGE':
        await this.api.createFridge({
          name: data['name'] as string,
          shelfCount: data['shelfCount'] as number,
        }).toPromise();
        break;

      case 'UPDATE_FRIDGE':
        await this.api.updateFridge(data['id'] as string, {
          name: data['name'] as string | undefined,
          shelfCount: data['shelfCount'] as number | undefined,
        }).toPromise();
        break;

      case 'DELETE_FRIDGE':
        await this.api.deleteFridge(data['id'] as string).toPromise();
        break;

      case 'ADD_ITEM':
        await this.api.addItem(
          data['fridgeId'] as string,
          data['shelfId'] as string,
          {
            name: data['name'] as string,
            depositDate: data['depositDate'] as string,
          }
        ).toPromise();
        break;

      case 'UPDATE_ITEM':
        await this.api.updateItem(
          data['fridgeId'] as string,
          data['shelfId'] as string,
          data['itemId'] as string,
          {
            name: data['name'] as string | undefined,
            depositDate: data['depositDate'] as string | undefined,
          }
        ).toPromise();
        break;

      case 'DELETE_ITEM':
        await this.api.deleteItem(
          data['fridgeId'] as string,
          data['shelfId'] as string,
          data['itemId'] as string
        ).toPromise();
        break;

      case 'UPDATE_SHELF':
        await this.api.updateShelfName(
          data['fridgeId'] as string,
          data['shelfId'] as string,
          { name: data['name'] as string }
        ).toPromise();
        break;

      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  private async updateSyncStatus(): Promise<void> {
    const pendingOps = await this.offlineStorage.getPendingOperations();
    const lastSync = await this.offlineStorage.getLastSync();

    this.syncStatus.update((s) => ({
      ...s,
      pendingCount: pendingOps.length,
      lastSyncAt: lastSync,
    }));
  }

  async getPendingCount(): Promise<number> {
    const ops = await this.offlineStorage.getPendingOperations();
    return ops.length;
  }
}
