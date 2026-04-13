import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { AuthStore } from '../../store/auth.store';

import { APP_VERSION } from '../../version';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatDividerModule,
    RouterLink,
  ],
  host: { class: 'settings-page' },
  template: `
    <div class="settings-container">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>settings</mat-icon>
          <mat-card-title>{{ i18n.translate('settings.title') }}</mat-card-title>
          <mat-card-subtitle>{{ i18n.translate('settings.subtitle') }}</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>info</mat-icon>
              <div matListItemTitle>{{ i18n.translate('settings.version') }}</div>
              <div matListItemLine>{{ appVersion }}</div>
            </mat-list-item>
            
            <mat-divider></mat-divider>
            
            <mat-list-item>
              <mat-icon matListItemIcon>language</mat-icon>
              <div matListItemTitle>{{ i18n.translate('settings.language') }}</div>
              <div matListItemLine>{{ currentLanguage() }}</div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-button routerLink="/">
            <mat-icon>arrow_back</mat-icon>
            {{ i18n.translate('common.back') }}
          </button>
          <span class="actions-spacer"></span>
          <button mat-button color="warn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            {{ i18n.translate('login.logout') }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 600px;
      margin: 16px auto;
      padding: 0 16px;
    }
    
    mat-card {
      margin-top: 16px;
    }
    
    mat-card-header {
      margin-bottom: 16px;
    }

    .actions-spacer {
      flex: 1 1 auto;
    }

    [mat-card-avatar] {
      font-size: 40px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);
  protected readonly authStore = inject(AuthStore);
  protected readonly appVersion = APP_VERSION;
  
  currentLanguage(): string {
    const lang = this.i18n.getCurrentLanguage();
    return this.i18n.translate(`language.${lang === 'de' ? 'german' : 'english'}`);
  }

  logout(): void {
    this.authStore.logout();
  }
}
