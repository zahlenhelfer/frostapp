import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStore } from '../../store/auth.store';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTabsModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>kitchen</mat-icon>
          <mat-card-title>{{ i18n.translate('app.title') }}</mat-card-title>
          <mat-card-subtitle>{{ i18n.translate('login.subtitle') }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (authStore.error()) {
            <div class="error-message">{{ authStore.error() }}</div>
          }

          <mat-tab-group [selectedIndex]="activeTab()" (selectedIndexChange)="activeTab.set($event)">
            <mat-tab [label]="i18n.translate('login.loginTab')">
              <form (ngSubmit)="onLogin()" class="login-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ i18n.translate('login.username') }}</mat-label>
                  <input
                    matInput
                    type="text"
                    [(ngModel)]="username"
                    name="loginUsername"
                    required
                    autocomplete="username"
                    [disabled]="authStore.isBusy()"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ i18n.translate('login.password') }}</mat-label>
                  <input
                    matInput
                    [type]="hidePassword() ? 'password' : 'text'"
                    [(ngModel)]="password"
                    name="loginPassword"
                    required
                    autocomplete="current-password"
                    [disabled]="authStore.isBusy()"
                  />
                  <button
                    mat-icon-button
                    matSuffix
                    type="button"
                    (click)="hidePassword.set(!hidePassword())"
                    [attr.aria-label]="'Toggle password visibility'"
                  >
                    <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </mat-form-field>

                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  class="full-width"
                  [disabled]="authStore.isBusy() || !username() || !password()"
                >
                  @if (authStore.isBusy()) {
                    <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
                  }
                  {{ i18n.translate('login.submit') }}
                </button>
              </form>
            </mat-tab>

            <mat-tab [label]="i18n.translate('login.registerTab')">
              <form (ngSubmit)="onRegister()" class="login-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ i18n.translate('login.username') }}</mat-label>
                  <input
                    matInput
                    type="text"
                    [(ngModel)]="registerUsername"
                    name="registerUsername"
                    required
                    autocomplete="username"
                    [disabled]="authStore.isBusy()"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>{{ i18n.translate('login.password') }}</mat-label>
                  <input
                    matInput
                    [type]="hideRegisterPassword() ? 'password' : 'text'"
                    [(ngModel)]="registerPassword"
                    name="registerPassword"
                    required
                    autocomplete="new-password"
                    [disabled]="authStore.isBusy()"
                  />
                  <button
                    mat-icon-button
                    matSuffix
                    type="button"
                    (click)="hideRegisterPassword.set(!hideRegisterPassword())"
                    [attr.aria-label]="'Toggle password visibility'"
                  >
                    <mat-icon>{{ hideRegisterPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </mat-form-field>

                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  class="full-width"
                  [disabled]="authStore.isBusy() || !registerUsername() || !registerPassword()"
                >
                  @if (authStore.isBusy()) {
                    <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
                  }
                  {{ i18n.translate('login.registerSubmit') }}
                </button>
              </form>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 16px;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
    }

    mat-card-header {
      margin-bottom: 16px;
      justify-content: center;
    }

    [mat-card-avatar] {
      font-size: 40px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1976d2;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 16px;
    }

    .full-width {
      width: 100%;
    }

    .error-message {
      color: #d32f2f;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .inline-spinner {
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  protected readonly authStore = inject(AuthStore);
  protected readonly i18n = inject(I18nService);

  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly registerUsername = signal('');
  protected readonly registerPassword = signal('');
  protected readonly hidePassword = signal(true);
  protected readonly hideRegisterPassword = signal(true);
  protected readonly activeTab = signal(0);

  onLogin(): void {
    if (!this.username() || !this.password()) return;
    this.authStore.login({ username: this.username(), password: this.password() });
  }

  onRegister(): void {
    if (!this.registerUsername() || !this.registerPassword()) return;
    this.authStore.register({
      username: this.registerUsername(),
      password: this.registerPassword(),
    });
  }
}
