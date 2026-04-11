import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import type { Shelf, FrostItem } from '@frostapp/shared';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-frost-item-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatChipsModule, DatePipe],
  template: `
    <div class="shelf-content">
      <div class="shelf-header">
        <h3>{{ shelf().name }}</h3>
        <button mat-raised-button color="primary" (click)="onAdd()">
          <mat-icon>add</mat-icon>
          {{ i18n.translate('item.add') }}
        </button>
      </div>

      @if (shelf().items.length === 0) {
        <div class="empty-state">
          <mat-icon>inventory_2</mat-icon>
          <p>{{ i18n.translate('shelf.empty') }}</p>
        </div>
      } @else {
        <mat-list>
          @for (item of shelf().items; track item.id) {
            <mat-list-item class="item-row">
              <mat-icon matListItemIcon>ac_unit</mat-icon>
              <div matListItemTitle>{{ item.name }}</div>
              <div matListItemLine>
                {{ i18n.translate('item.depositDate') }}: {{ item.depositDate | date:'mediumDate' }}
              </div>
              <button
                mat-icon-button
                matListItemMeta
                (click)="onEdit(item)"
                [attr.aria-label]="i18n.translate('item.edit')"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                matListItemMeta
                (click)="onDelete(item)"
                [attr.aria-label]="i18n.translate('item.delete')"
              >
                <mat-icon color="warn">delete</mat-icon>
              </button>
            </mat-list-item>
          }
        </mat-list>
      }
    </div>
  `,
  styles: [`
    .shelf-content {
      padding: 16px 0;
    }
    .shelf-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 0 16px;
    }
    .shelf-header h3 {
      margin: 0;
    }
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .item-row {
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrostItemListComponent {
  shelf = input.required<Shelf>();
  fridgeId = input.required<string>();
  addItem = output<{ shelfId: string; fridgeId: string }>();
  editItem = output<{ shelfId: string; fridgeId: string; itemId: string }>();
  deleteItem = output<{ shelfId: string; fridgeId: string; itemId: string }>();

  protected readonly i18n = inject(I18nService);

  onAdd(): void {
    this.addItem.emit({ shelfId: this.shelf().id, fridgeId: this.fridgeId() });
  }

  onEdit(item: FrostItem): void {
    this.editItem.emit({ shelfId: this.shelf().id, fridgeId: this.fridgeId(), itemId: item.id });
  }

  onDelete(item: FrostItem): void {
    this.deleteItem.emit({ shelfId: this.shelf().id, fridgeId: this.fridgeId(), itemId: item.id });
  }
}
