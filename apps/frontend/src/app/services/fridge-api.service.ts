import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Fridge, FrostItem, CreateFridgeRequest, UpdateFridgeRequest, CreateItemRequest, UpdateItemRequest, UpdateShelfRequest } from '@frostapp/shared';

// Access global process if available (for SSR/build time)
declare const process: { env?: Record<string, string> } | undefined;

// Use environment-based API URL with fallback
const API_BASE_URL = (typeof process !== 'undefined' && process?.env?.['API_BASE_URL']) 
  || (typeof window !== 'undefined' && (window as { ENV?: { API_URL?: string } }).ENV?.API_URL)
  || 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root',
})
export class FridgeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  // Fridges
  getAllFridges(): Observable<Fridge[]> {
    return this.http.get<Fridge[]>(`${this.baseUrl}/fridges`);
  }

  getFridge(id: string): Observable<Fridge> {
    return this.http.get<Fridge>(`${this.baseUrl}/fridges/${encodeURIComponent(id)}`);
  }

  createFridge(data: CreateFridgeRequest): Observable<Fridge> {
    return this.http.post<Fridge>(`${this.baseUrl}/fridges`, data);
  }

  updateFridge(id: string, data: UpdateFridgeRequest): Observable<Fridge> {
    return this.http.patch<Fridge>(`${this.baseUrl}/fridges/${encodeURIComponent(id)}`, data);
  }

  deleteFridge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/fridges/${encodeURIComponent(id)}`);
  }

  // Items
  addItem(fridgeId: string, shelfId: string, data: CreateItemRequest): Observable<FrostItem> {
    return this.http.post<FrostItem>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}/items`,
      data
    );
  }

  updateItem(fridgeId: string, shelfId: string, itemId: string, data: UpdateItemRequest): Observable<FrostItem> {
    return this.http.patch<FrostItem>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}/items/${encodeURIComponent(itemId)}`,
      data
    );
  }

  deleteItem(fridgeId: string, shelfId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}/items/${encodeURIComponent(itemId)}`
    );
  }

  // Shelves
  updateShelfName(fridgeId: string, shelfId: string, data: UpdateShelfRequest): Observable<{ id: string; name: string; items: FrostItem[] }> {
    return this.http.patch<{ id: string; name: string; items: FrostItem[] }>(
      `${this.baseUrl}/fridges/${encodeURIComponent(fridgeId)}/shelves/${encodeURIComponent(shelfId)}`,
      data
    );
  }
  
  // Legacy API key methods removed in favor of JWT authentication
}
