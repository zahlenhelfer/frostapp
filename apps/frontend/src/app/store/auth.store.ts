import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { UserProfile, LoginRequest, RegisterRequest } from '@frostapp/shared';

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, isLoading }) => ({
    isAuthenticated: computed(() => !!user()),
    isBusy: computed(() => isLoading()),
  })),
  withMethods((store, authService = inject(AuthService), router = inject(Router)) => ({
    setLoading(loading: boolean): void {
      patchState(store, { isLoading: loading });
    },

    setUser(user: UserProfile | null): void {
      patchState(store, { user, error: null });
    },

    setError(error: string | null): void {
      patchState(store, { error });
    },

    clearAuth(): void {
      authService.clearToken();
      patchState(store, initialState);
      router.navigate(['/login']);
    },

    initAuth: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          if (!authService.isAuthenticated()) {
            patchState(store, { isLoading: false });
            return of(null);
          }
          return authService.getCurrentUser().pipe(
            tapResponse({
              next: (user) => patchState(store, { user, isLoading: false }),
              error: () => {
                authService.clearToken();
                patchState(store, { user: null, isLoading: false });
              },
            })
          );
        })
      )
    ),

    login: rxMethod<LoginRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) =>
          authService.login(credentials).pipe(
            tapResponse({
              next: (response) => {
                authService.setToken(response.token);
                patchState(store, { user: response.user, isLoading: false, error: null });
                router.navigate(['/']);
              },
              error: (error: { error?: { message?: string }; message?: string }) => {
                const message = error?.error?.message || error?.message || 'Login failed';
                patchState(store, { isLoading: false, error: message });
              },
            })
          )
        )
      )
    ),

    register: rxMethod<RegisterRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((credentials) =>
          authService.register(credentials).pipe(
            tapResponse({
              next: (response) => {
                authService.setToken(response.token);
                patchState(store, { user: response.user, isLoading: false, error: null });
                router.navigate(['/']);
              },
              error: (error: { error?: { message?: string }; message?: string }) => {
                const message = error?.error?.message || error?.message || 'Registration failed';
                patchState(store, { isLoading: false, error: message });
              },
            })
          )
        )
      )
    ),

    logout(): void {
      authService.clearToken();
      patchState(store, initialState);
      router.navigate(['/login']);
    },
  }))
);
