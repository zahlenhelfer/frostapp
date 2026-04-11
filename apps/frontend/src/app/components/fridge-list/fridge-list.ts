import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import type { Fridge } from '@frostapp/shared';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-fridge-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule],
  template: `
    <div class="fridge-list">
      <div class="fridge-list-header">
        <h2>{{ i18n.translate('fridge.fridges') }}</h2>
        <button mat-raised-button color="primary" (click)="onCreate()">
          <mat-icon>add</mat-icon>
          {{ i18n.translate('fridge.create') }}
        </button>
      </div>

      @if (fridges().length === 0) {
        <div class="empty-state">
          <mat-icon>kitchen</mat-icon>
          <p>{{ i18n.translate('fridge.empty') }}</p>
        </div>
      } @else {
        <mat-list>
          @for (fridge of fridges(); track fridge.id) {
            <mat-list-item (click)="onSelect(fridge)" class="fridge-item">
              <mat-icon matListItemIcon>kitchen</mat-icon>
              <div matListItemTitle>{{ fridge.name }}</div>
              <div matListItemLine>
                {{ fridge.shelfCount }} {{ i18n.translate('shelf.shelves') }}
                ·
                {{ getItemCount(fridge) }} {{ i18n.translate('item.items') }}
              </div>
              <button
                mat-icon-button
                matListItemMeta
                (click)="onEdit($event, fridge)"
                [attr.aria-label]="i18n.translate('fridge.edit')"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                matListItemMeta
                (click)="onDelete($event, fridge)"
                [attr.aria-label]="i18n.translate('fridge.delete')"
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
    .fridge-list {
      padding: 16px;
    }
    .fridge-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .fridge-list-header h2 {
      margin: 0;
    }
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }
    .fridge-item {
      cursor: pointer;
    }
    .fridge-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FridgeListComponent {
  fridges = input.required<Fridge[]>();
  select = output<Fridge>();
  create = output<void>();
  edit = output<Fridge>();
  delete = output<Fridge>();

  protected readonly i18n = inject(I18nService);

  onSelect(fridge: Fridge): void {
    this.select.emit(fridge);
  }

  onCreate(): void {
    this.create.emit();
  }

  onEdit(event: Event, fridge: Fridge): void {
    event.stopPropagation();
    this.edit.emit(fridge);
  }

  onDelete(event: Event, fridge: Fridge): void {
    event.stopPropagation();
    this.delete.emit(fridge);
  }

  getItemCount(fridge: Fridge): number {
    return fridge.shelves.reduce((total, shelf) => total + shelf.items.length, 0);
  }
}
