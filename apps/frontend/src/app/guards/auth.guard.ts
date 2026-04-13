import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthStore } from '../store/auth.store';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Clear stale token and user state, then redirect to login
  authService.clearToken();
  authStore.setUser(null);
  return router.parseUrl('/login');
};
