import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher';
import { SyncIndicatorComponent } from './components/sync-indicator/sync-indicator';
import { I18nService } from './services/i18n.service';
import { FridgeStore } from './store/fridge.store';
import { AuthStore } from './store/auth.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatProgressSpinnerModule,
    LanguageSwitcherComponent,
    SyncIndicatorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly store = inject(FridgeStore);
  private readonly authStore = inject(AuthStore);
  protected readonly menuOpen = signal(false);
  protected readonly isAuthenticated = this.authStore.isAuthenticated;

  ngOnInit(): void {
    // Initialize auth state from stored token
    this.authStore.initAuth();
    // Initialize store (network status, etc.)
    this.store.init();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.authStore.logout();
  }
}
