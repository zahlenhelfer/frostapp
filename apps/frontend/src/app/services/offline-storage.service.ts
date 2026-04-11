import { Injectable } from '@angular/core';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Fridge, FrostItem } from '@frostapp/shared';

const DB_NAME = 'frostapp-offline';
const DB_VERSION = 1;

interface FrostAppSchema extends DBSchema {
  fridges: {
    key: string;
    value: Fridge;
  };
  pendingOperations: {
    key: number;
    value: PendingOperation;
  };
  syncMetadata: {
    key: string;
    value: { key: string; lastSyncedAt: string };
  };
}

export type PendingOperationType = 
  | 'CREATE_FRIDGE'
  | 'UPDATE_FRIDGE'
  | 'DELETE_FRIDGE'
  | 'ADD_ITEM'
  | 'UPDATE_ITEM'
  | 'DELETE_ITEM'
  | 'UPDATE_SHELF';

export interface PendingOperation {
  id?: number;
  type: PendingOperationType;
  timestamp: string;
  data: unknown;
  retryCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private db: IDBPDatabase<FrostAppSchema> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<FrostAppSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('fridges')) {
          db.createObjectStore('fridges', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      },
    });
  }

  // Fridge operations
  async saveFridges(fridges: Fridge[]): Promise<void> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('fridges', 'readwrite');
    await tx.store.clear();
    for (const fridge of fridges) {
      await tx.store.put(fridge);
    }
    await tx.done;
  }

  async getFridges(): Promise<Fridge[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('fridges');
  }

  async saveFridge(fridge: Fridge): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('fridges', fridge);
  }

  async deleteFridge(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('fridges', id);
  }

  // Pending operations queue
  async addPendingOperation(operation: Omit<PendingOperation, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    return this.db!.add('pendingOperations', operation as PendingOperation);
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('pendingOperations');
  }

  async removePendingOperation(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('pendingOperations', id);
  }

  async updatePendingOperationRetry(id: number, retryCount: number): Promise<void> {
    if (!this.db) await this.init();
    const op = await this.db!.get('pendingOperations', id);
    if (op) {
      op.retryCount = retryCount;
      await this.db!.put('pendingOperations', op);
    }
  }

  async clearPendingOperations(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear('pendingOperations');
  }

  // Sync metadata
  async updateLastSync(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('syncMetadata', {
      key: 'lastSync',
      lastSyncedAt: new Date().toISOString(),
    });
  }

  async getLastSync(): Promise<string | null> {
    if (!this.db) await this.init();
    const meta = await this.db!.get('syncMetadata', 'lastSync');
    return meta?.lastSyncedAt || null;
  }

  // Clear all data (for logout/reset)
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear('fridges');
    await this.db!.clear('pendingOperations');
    await this.db!.clear('syncMetadata');
  }
}
