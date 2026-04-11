import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="languageMenu" [attr.aria-label]="i18n.translate('nav.language')">
      <mat-icon>language</mat-icon>
    </button>
    <mat-menu #languageMenu="matMenu">
      <button mat-menu-item (click)="setLanguage('de')" [disabled]="currentLanguage() === 'de'">
        <span>{{ i18n.translate('language.german') }}</span>
      </button>
      <button mat-menu-item (click)="setLanguage('en')" [disabled]="currentLanguage() === 'en'">
        <span>{{ i18n.translate('language.english') }}</span>
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly currentLanguage = this.i18n.language;

  setLanguage(lang: 'de' | 'en'): void {
    this.i18n.setLanguage(lang);
  }
}
