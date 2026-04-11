import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Fridge, FrostItem, CreateFridgeRequest, UpdateFridgeRequest, CreateItemRequest, UpdateItemRequest, UpdateShelfRequest } from '@frostapp/shared';

// Access global process if available (for SSR/build time)
declare const process: { env?: Record<string, string> } | undefined;

// Use environment-based API URL with fallback
const API_BASE_URL = (typeof process !== 'undefined' && process?.env?.['API_BASE_URL']) 
  || (typeof window !== 'undefined' && (window as { ENV?: { API_URL?: string } }).ENV?.API_URL)
  || 'http://localhost:3000/api';

// API Key from environment or localStorage for development
function getApiKey(): string {
  if (typeof window !== 'undefined') {
    // Check localStorage first (for development)
    const storedKey = localStorage.getItem('frostapp_api_key');
    if (storedKey) return storedKey;
  }
  // Fallback to environment or default dev key
  return (typeof process !== 'undefined' && process?.env?.['API_KEY']) 
    || 'dev-api-key-change-in-production';
}

@Injectable({
  providedIn: 'root',
})
export class FridgeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-API-Key': getApiKey()
    });
  }

  // Fridges
  getAllFridges(): Observable<Fridge[]> {
    return this.http.get<Fridge[]>(`${this.baseUrl}/fridges`, { headers: this.getHeaders() });
  }

  getFridge(id: string): Observable<Fridge> {
    return this.http.get<Fridge>(`${this.baseUrl}/fridges/${encodeURIComponent(id)}`, { headers: this.getHeaders() });
  }

  createFridge(data: CreateFridgeRequest): Observable<Fridge> {
    return this.http.post<Fridge>(`${this.baseUrl}/fridges`, data, { headers: this.getHeaders() });
  }

  updateFridge(id: string, data: UpdateFridgeRequest): Observable<Fridge> {
    return this.http.patch<Fridge>(`${this.baseUrl}/fridges/${encodeURIComponent(id)}`, data, { headers: this.getHeaders() });
  }

  deleteFridge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/fridges/${encodeURIComponent(id)}`, { headers: this.getHeaders() });
  }

  // Items
  addItem(fridgeId: string, shelfId: string, data: CreateItemRequest): Observable<FrostItem> {
    return this.http.post<FrostItem>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}/items`, 
      data, 
      { headers: this.getHeaders() }
    );
  }

  updateItem(fridgeId: string, shelfId: string, itemId: string, data: UpdateItemRequest): Observable<FrostItem> {
    return this.http.patch<FrostItem>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}/items/${encodeURIComponent(itemId)}`, 
      data, 
      { headers: this.getHeaders() }
    );
  }

  deleteItem(fridgeId: string, shelfId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}/items/${encodeURIComponent(itemId)}`, 
      { headers: this.getHeaders() }
    );
  }

  // Shelves
  updateShelfName(fridgeId: string, shelfId: string, data: UpdateShelfRequest): Observable<{ id: string; name: string; items: FrostItem[] }> {
    return this.http.patch<{ id: string; name: string; items: FrostItem[] }>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}`, 
      data, 
      { headers: this.getHeaders() }
    );
  }
  
  // Set API key for authentication
  setApiKey(key: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('frostapp_api_key', key);
    }
  }
  
  // Clear API key
  clearApiKey(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('frostapp_api_key');
    }
  }
}
