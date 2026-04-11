import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { App } from './app';
import { OfflineStorageService } from './services/offline-storage.service';

// Mock OfflineStorageService for tests
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

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OfflineStorageService, useValue: mockOfflineStorageService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render toolbar title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('FrostApp');
  });
});
