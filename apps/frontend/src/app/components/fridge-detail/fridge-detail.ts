import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import type { Fridge, Shelf } from '@frostapp/shared';
import { I18nService } from '../../services/i18n.service';
import { FrostItemListComponent } from '../frost-item-list/frost-item-list';

@Component({
  selector: 'app-fridge-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    FrostItemListComponent,
  ],
  template: `
    <div class="fridge-detail">
      <div class="fridge-header">
        <button mat-icon-button (click)="onBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2>{{ fridge().name }}</h2>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-tab-group [selectedIndex]="selectedShelfIndex()" (selectedIndexChange)="onShelfChange($event)">
            @for (shelf of fridge().shelves; track shelf.id) {
              <mat-tab>
                <ng-template mat-tab-label>
                  <span [matBadge]="shelf.items.length" matBadgeSize="small" matBadgeOverlap="false">
                    {{ shelf.name }}
                  </span>
                </ng-template>
                <app-frost-item-list
                  [shelf]="shelf"
                  [fridgeId]="fridge().id"
                  (addItem)="onAddItem($event)"
                  (editItem)="onEditItem($event)"
                  (deleteItem)="onDeleteItem($event)"
                />
              </mat-tab>
            }
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .fridge-detail {
      padding: 16px;
    }
    .fridge-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .fridge-header h2 {
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FridgeDetailComponent {
  fridge = input.required<Fridge>();
  selectedShelfId = input<string | null>(null);
  back = output<void>();
  shelfChange = output<string>();
  addItem = output<{ shelfId: string; fridgeId: string }>();
  editItem = output<{ shelfId: string; fridgeId: string; itemId: string }>();
  deleteItem = output<{ shelfId: string; fridgeId: string; itemId: string }>();

  protected readonly i18n = inject(I18nService);

  selectedShelfIndex(): number {
    const id = this.selectedShelfId();
    if (!id) return 0;
    return this.fridge().shelves.findIndex((s) => s.id === id) ?? 0;
  }

  onBack(): void {
    this.back.emit();
  }

  onShelfChange(index: number): void {
    const shelf = this.fridge().shelves[index];
    if (shelf) {
      this.shelfChange.emit(shelf.id);
    }
  }

  onAddItem(event: { shelfId: string; fridgeId: string }): void {
    this.addItem.emit(event);
  }

  onEditItem(event: { shelfId: string; fridgeId: string; itemId: string }): void {
    this.editItem.emit(event);
  }

  onDeleteItem(event: { shelfId: string; fridgeId: string; itemId: string }): void {
    this.deleteItem.emit(event);
  }
}
