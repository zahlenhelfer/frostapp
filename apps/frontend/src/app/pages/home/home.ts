import { ChangeDetectionStrategy, Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { FridgeStore } from '../../store/fridge.store';
import { FridgeListComponent } from '../../components/fridge-list/fridge-list';
import { FridgeDetailComponent } from '../../components/fridge-detail/fridge-detail';
import { FridgeFormComponent } from '../../components/fridge-form/fridge-form';
import { ItemFormComponent } from '../../components/item-form/item-form';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { QrCodeDialogComponent } from '../../components/qr-code-dialog/qr-code-dialog';
import { I18nService } from '../../services/i18n.service';
import { NetworkStatusService } from '../../services/network-status.service';
import { SyncService } from '../../services/sync.service';
import type { Fridge } from '@frostapp/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, MatIconModule, FridgeListComponent, FridgeDetailComponent],
  template: `
    <div class="home-container">
      @if (isOffline()) {
        <div class="offline-banner">
          <mat-icon>cloud_off</mat-icon>
          <span>{{ i18n.translate('sync.offlineTooltip') }}</span>
        </div>
      }
      
      @if (selectedFridge(); as fridge) {
        <app-fridge-detail
          [fridge]="fridge"
          [selectedShelfId]="selectedShelfId()"
          (back)="onBack()"
          (shelfChange)="onShelfChange($event)"
          (addItem)="onAddItem($event)"
          (editItem)="onEditItem($event)"
          (deleteItem)="onDeleteItem($event)"
        />
      } @else {
        <app-fridge-list
          [fridges]="fridges()"
          (select)="onSelectFridge($event)"
          (create)="onCreateFridge()"
          (edit)="onEditFridge($event)"
          (delete)="onDeleteFridge($event)"
        />
      }
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .offline-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #fff3e0;
      color: #e65100;
      padding: 12px 16px;
      margin: 16px;
      border-radius: 4px;
      border-left: 4px solid #ff9800;
    }
    .offline-banner mat-icon {
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly store = inject(FridgeStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly i18n = inject(I18nService);
  protected readonly networkStatus = inject(NetworkStatusService);
  private readonly syncService = inject(SyncService);

  fridges = this.store.fridges;
  selectedFridge = this.store.selectedFridge;
  selectedShelfId = this.store.selectedShelfId;
  isOffline = this.networkStatus.offline;

  constructor() {
    // Show sync status messages
    effect(() => {
      const status = this.syncService.syncStatus();
      if (status.error && !status.isSyncing) {
        this.snackBar.open(status.error, 'OK', { duration: 5000 });
      }
    });
  }

  ngOnInit(): void {
    this.store.loadFridges();
  }

  onSelectFridge(fridge: Fridge): void {
    this.store.selectFridge(fridge.id);
  }

  onBack(): void {
    this.store.selectFridge(null);
  }

  onShelfChange(shelfId: string): void {
    this.store.selectShelf(shelfId);
  }

  onCreateFridge(): void {
    const dialogRef = this.dialog.open(FridgeFormComponent, {
      width: '400px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.createFridge({ name: result.name, shelfCount: result.shelfCount });
      }
    });
  }

  onEditFridge(fridge: Fridge): void {
    const dialogRef = this.dialog.open(FridgeFormComponent, {
      width: '400px',
      data: { fridge },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // For edit, we only update name (shelf count change would require complex migration)
        this.store.updateFridge({ id: fridge.id, updates: { name: result.name } });
      }
    });
  }

  onDeleteFridge(fridge: Fridge): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: this.i18n.translate('fridge.delete'),
        message: this.i18n.translate('fridge.confirmDelete'),
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteFridge(fridge.id);
      }
    });
  }

  onAddItem(event: { shelfId: string; fridgeId: string }): void {
    const dialogRef = this.dialog.open(ItemFormComponent, {
      width: '400px',
      data: { fridgeId: event.fridgeId, shelfId: event.shelfId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.addFrostItem({
          fridgeId: event.fridgeId,
          shelfId: event.shelfId,
          name: result.name,
          depositDate: result.depositDate,
        });

        // Show QR code dialog if requested
        if (result.generateQrCode) {
          // Wait a bit for the item to be created and state updated
          setTimeout(() => {
            const fridge = this.fridges().find((f) => f.id === event.fridgeId);
            const shelf = fridge?.shelves.find((s) => s.id === event.shelfId);
            // Find the most recently added item (highest timestamp in ID or last in list)
            const items = shelf?.items || [];
            const newItem = items[items.length - 1];
            
            if (newItem && fridge && shelf) {
              this.dialog.open(QrCodeDialogComponent, {
                width: '400px',
                data: {
                  itemId: newItem.id,
                  itemName: newItem.name,
                  fridgeId: event.fridgeId,
                  shelfId: event.shelfId,
                },
              });
            }
          }, 100);
        }
      }
    });
  }

  onEditItem(event: { shelfId: string; fridgeId: string; itemId: string }): void {
    const fridge = this.fridges().find((f) => f.id === event.fridgeId);
    const shelf = fridge?.shelves.find((s) => s.id === event.shelfId);
    const item = shelf?.items.find((i) => i.id === event.itemId);

    if (!item) return;

    const dialogRef = this.dialog.open(ItemFormComponent, {
      width: '400px',
      data: { item, fridgeId: event.fridgeId, shelfId: event.shelfId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateFrostItem({
          fridgeId: event.fridgeId,
          shelfId: event.shelfId,
          itemId: event.itemId,
          updates: { name: result.name, depositDate: result.depositDate },
        });

        // Show QR code dialog if requested
        if (result.showQrCode) {
          this.dialog.open(QrCodeDialogComponent, {
            width: '400px',
            data: {
              itemId: event.itemId,
              itemName: result.name,
              fridgeId: event.fridgeId,
              shelfId: event.shelfId,
            },
          });
        }
      }
    });
  }

  onDeleteItem(event: { shelfId: string; fridgeId: string; itemId: string }): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: {
        title: this.i18n.translate('item.delete'),
        message: this.i18n.translate('item.confirmDelete'),
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.store.deleteFrostItem({
          fridgeId: event.fridgeId,
          shelfId: event.shelfId,
          itemId: event.itemId,
        });
      }
    });
  }
}
