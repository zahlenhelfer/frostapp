import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NetworkStatusService } from '../../services/network-status.service';
import { SyncService } from '../../services/sync.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="sync-indicator">
      @if (isOffline()) {
        <button 
          mat-icon-button 
          [matTooltip]="i18n.translate('sync.offlineTooltip')"
          class="offline-indicator"
        >
          <mat-icon color="warn">cloud_off</mat-icon>
        </button>
      } @else if (syncStatus().isSyncing) {
        <button 
          mat-icon-button 
          [matTooltip]="i18n.translate('sync.syncingTooltip')"
          class="syncing-indicator"
        >
          <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
        </button>
      } @else if (syncStatus().pendingCount > 0) {
        <button 
          mat-icon-button 
          [matBadge]="syncStatus().pendingCount"
          matBadgeColor="accent"
          matBadgeSize="small"
          [matTooltip]="i18n.translate('sync.pendingTooltip')"
          (click)="triggerSync()"
        >
          <mat-icon color="accent">sync</mat-icon>
        </button>
      } @else {
        <button 
          mat-icon-button 
          [matTooltip]="i18n.translate('sync.onlineTooltip')"
        >
          <mat-icon color="primary">cloud_done</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    .sync-indicator {
      display: flex;
      align-items: center;
    }
    .offline-indicator {
      animation: pulse 2s infinite;
    }
    .syncing-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .inline-spinner {
      display: inline-block;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncIndicatorComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly networkStatus = inject(NetworkStatusService);
  protected readonly syncService = inject(SyncService);

  isOffline = this.networkStatus.offline;
  syncStatus = this.syncService.syncStatus;

  triggerSync(): void {
    this.syncService.triggerSync();
  }
}
