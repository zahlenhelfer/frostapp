import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface AppState {
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
}

const initialState: AppState = {
  isLoading: false,
  error: null,
  sidebarOpen: true,
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ isLoading, error, sidebarOpen }) => ({
    hasError: computed(() => error() !== null),
    isReady: computed(() => !isLoading() && error() === null),
    isSidebarOpen: computed(() => sidebarOpen()),
  })),
  withMethods((store) => ({
    setLoading(loading: boolean): void {
      patchState(store, { isLoading: loading });
    },
    setError(error: string | null): void {
      patchState(store, { error });
    },
    toggleSidebar(): void {
      patchState(store, (state) => ({ sidebarOpen: !state.sidebarOpen }));
    },
    setSidebarOpen(open: boolean): void {
      patchState(store, { sidebarOpen: open });
    },
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
