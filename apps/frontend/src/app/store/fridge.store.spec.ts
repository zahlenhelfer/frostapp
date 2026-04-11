import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { FridgeStore } from './fridge.store';
import { FridgeApiService } from '../services/fridge-api.service';
import { OfflineStorageService } from '../services/offline-storage.service';
import { NetworkStatusService } from '../services/network-status.service';
import { SyncService } from '../services/sync.service';

// Mock services
const mockOfflineStorageService = {
  init: vi.fn().mockResolvedValue(undefined),
  getFridges: vi.fn().mockResolvedValue([]),
  saveFridges: vi.fn().mockResolvedValue(undefined),
  saveFridge: vi.fn().mockResolvedValue(undefined),
  deleteFridge: vi.fn().mockResolvedValue(undefined),
  addPendingOperation: vi.fn().mockResolvedValue(1),
  getPendingOperations: vi.fn().mockResolvedValue([]),
  removePendingOperation: vi.fn().mockResolvedValue(undefined),
  updatePendingOperationRetry: vi.fn().mockResolvedValue(undefined),
  clearPendingOperations: vi.fn().mockResolvedValue(undefined),
  updateLastSync: vi.fn().mockResolvedValue(undefined),
  getLastSync: vi.fn().mockResolvedValue(null),
  clearAll: vi.fn().mockResolvedValue(undefined),
};

describe('FridgeStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        FridgeApiService,
        { provide: OfflineStorageService, useValue: mockOfflineStorageService },
        NetworkStatusService,
        SyncService,
      ],
    });
  });

  it('should create the store', () => {
    const instance = TestBed.inject(FridgeStore);
    expect(instance).toBeTruthy();
    expect(instance.fridges()).toEqual([]);
  });

  it('should select a fridge', () => {
    const instance = TestBed.inject(FridgeStore);
    
    instance.selectFridge('test-id');

    expect(instance.selectedFridgeId()).toBe('test-id');
  });

  it('should select a shelf', () => {
    const instance = TestBed.inject(FridgeStore);
    
    instance.selectShelf('shelf-id');

    expect(instance.selectedShelfId()).toBe('shelf-id');
  });

  it('should calculate fridge count correctly', () => {
    const instance = TestBed.inject(FridgeStore);
    
    expect(instance.fridgeCount()).toBe(0);
    
    // Manually set fridges for testing computed
    instance.loadFridges();
    expect(instance.fridgeCount()).toBe(0);
  });

  it('should calculate total item count correctly', () => {
    const instance = TestBed.inject(FridgeStore);
    
    expect(instance.totalItemCount()).toBe(0);
  });
});
