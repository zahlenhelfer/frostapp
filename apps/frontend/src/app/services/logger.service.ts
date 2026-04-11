import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  log(message: string, ...optionalParams: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(`[FrostApp] ${message}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    console.error(`[FrostApp] ERROR: ${message}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(`[FrostApp] WARN: ${message}`, ...optionalParams);
  }
}
