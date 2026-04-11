import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class NetworkStatusService {
  private readonly isOnline = signal<boolean>(true);
  private readonly isBrowser: boolean;

  readonly online = this.isOnline.asReadonly();
  readonly offline = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      // Set initial state
      this.isOnline.set(navigator.onLine);
      this.offline.set(!navigator.onLine);

      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.offline.set(false);
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        this.offline.set(true);
      });
    }

    // Keep offline signal in sync
    effect(() => {
      this.offline.set(!this.isOnline());
    });
  }

  get isOnlineNow(): boolean {
    if (!this.isBrowser) return true;
    return navigator.onLine;
  }
}
