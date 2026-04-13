import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile } from '@frostapp/shared';

// Access global process if available (for SSR/build time)
declare const process: { env?: Record<string, string> } | undefined;

const API_BASE_URL = (typeof process !== 'undefined' && process?.env?.['API_BASE_URL'])
  || (typeof window !== 'undefined' && (window as { ENV?: { API_URL?: string } }).ENV?.API_URL)
  || 'http://localhost:3000';

const TOKEN_KEY = 'frostapp_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, credentials);
  }

  register(credentials: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, credentials);
  }

  getCurrentUser(): Observable<UserProfile | null> {
    return this.http.get<UserProfile>(`${this.baseUrl}/auth/me`).pipe(
      catchError(() => of(null))
    );
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      // Also clear legacy API key
      localStorage.removeItem('frostapp_api_key');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
