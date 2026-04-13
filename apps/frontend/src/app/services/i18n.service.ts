import { Injectable, signal } from '@angular/core';

type Language = 'de' | 'en';

interface Translations {
  [key: string]: string;
}

const TRANSLATIONS: Record<Language, Translations> = {
  de: {
    'app.title': 'FrostApp',
    'app.loading': 'Laden...',
    'nav.home': 'Startseite',
    'nav.fridges': 'Gefrierschränke',
    'nav.language': 'Sprache',
    'fridge.title': 'Gefrierschrank',
    'fridge.fridges': 'Gefrierschränke',
    'fridge.create': 'Neuer Gefrierschrank',
    'fridge.edit': 'Gefrierschrank bearbeiten',
    'fridge.delete': 'Löschen',
    'fridge.name': 'Name',
    'fridge.name.placeholder': 'z.B. Kühl-Gefrier-Kombi',
    'fridge.shelfCount': 'Anzahl Fächer',
    'fridge.save': 'Speichern',
    'fridge.cancel': 'Abbrechen',
    'fridge.confirmDelete': 'Möchten Sie diesen Gefrierschrank wirklich löschen?',
    'fridge.empty': 'Noch keine Gefrierschränke vorhanden',
    'shelf.title': 'Fach',
    'shelf.shelves': 'Fächer',
    'shelf.empty': 'Dieses Fach ist leer',
    'item.title': 'Gefriergut',
    'item.items': 'Gefriergüter',
    'item.create': 'Neues Gefriergut',
    'item.edit': 'Gefriergut bearbeiten',
    'item.delete': 'Löschen',
    'item.name': 'Name',
    'item.name.placeholder': 'z.B. Erdbeeren',
    'item.depositDate': 'Einfrierdatum',
    'item.add': 'Hinzufügen',
    'item.save': 'Speichern',
    'item.cancel': 'Abbrechen',
    'item.confirmDelete': 'Möchten Sie dieses Gefriergut wirklich löschen?',
    'item.generateQrCode': 'QR-Code erstellen',
    'item.showQrCode': 'QR-Code anzeigen',
    'qrCode.title': 'QR-Code',
    'qrCode.print': 'Drucken',
    'qrCode.scanToView': 'Scannen, um Artikel anzuzeigen',
    'qrCode.hint': 'Drucken Sie diesen QR-Code aus und kleben Sie ihn auf das Gefriergut',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.close': 'Schließen',
    'common.back': 'Zurück',
    'language.german': 'Deutsch',
    'language.english': 'Englisch',
    'sync.offlineTooltip': 'Offline - Änderungen werden lokal gespeichert',
    'sync.syncingTooltip': 'Synchronisiere...',
    'sync.pendingTooltip': 'Klicken zum Synchronisieren',
    'sync.onlineTooltip': 'Online - Alle Daten synchronisiert',
    'settings.title': 'Einstellungen',
    'settings.subtitle': 'App-Einstellungen und Informationen',
    'settings.version': 'Version',
    'settings.language': 'Sprache',
    'nav.settings': 'Einstellungen',
    'nav.menu': 'Menü',
    'login.subtitle': 'Anmelden',
    'login.loginTab': 'Anmelden',
    'login.registerTab': 'Registrieren',
    'login.username': 'Benutzername',
    'login.password': 'Passwort',
    'login.submit': 'Anmelden',
    'login.registerSubmit': 'Registrieren',
    'login.logout': 'Abmelden',
  },
  en: {
    'app.title': 'FrostApp',
    'app.loading': 'Loading...',
    'nav.home': 'Home',
    'nav.fridges': 'Fridges',
    'nav.language': 'Language',
    'fridge.title': 'Fridge',
    'fridge.fridges': 'Fridges',
    'fridge.create': 'New Fridge',
    'fridge.edit': 'Edit Fridge',
    'fridge.delete': 'Delete',
    'fridge.name': 'Name',
    'fridge.name.placeholder': 'e.g. Kitchen Fridge',
    'fridge.shelfCount': 'Number of Shelves',
    'fridge.save': 'Save',
    'fridge.cancel': 'Cancel',
    'fridge.confirmDelete': 'Are you sure you want to delete this fridge?',
    'fridge.empty': 'No fridges yet',
    'shelf.title': 'Shelf',
    'shelf.shelves': 'Shelves',
    'shelf.empty': 'This shelf is empty',
    'item.title': 'Frost Item',
    'item.items': 'Frost Items',
    'item.create': 'New Frost Item',
    'item.edit': 'Edit Frost Item',
    'item.delete': 'Delete',
    'item.name': 'Name',
    'item.name.placeholder': 'e.g. Strawberries',
    'item.depositDate': 'Deposit Date',
    'item.add': 'Add',
    'item.save': 'Save',
    'item.cancel': 'Cancel',
    'item.confirmDelete': 'Are you sure you want to delete this frost item?',
    'item.generateQrCode': 'Generate QR Code',
    'item.showQrCode': 'Show QR Code',
    'qrCode.title': 'QR Code',
    'qrCode.print': 'Print',
    'qrCode.scanToView': 'Scan to view item',
    'qrCode.hint': 'Print this QR code and attach it to the frost item',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.close': 'Close',
    'common.back': 'Back',
    'language.german': 'German',
    'language.english': 'English',
    'sync.offlineTooltip': 'Offline - Changes saved locally',
    'sync.syncingTooltip': 'Syncing...',
    'sync.pendingTooltip': 'Click to sync',
    'sync.onlineTooltip': 'Online - All data synced',
    'settings.title': 'Settings',
    'settings.subtitle': 'App settings and information',
    'settings.version': 'Version',
    'settings.language': 'Language',
    'nav.settings': 'Settings',
    'nav.menu': 'Menu',
    'login.subtitle': 'Sign in',
    'login.loginTab': 'Sign in',
    'login.registerTab': 'Register',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.submit': 'Sign in',
    'login.registerSubmit': 'Register',
    'login.logout': 'Logout',
  },
};

const STORAGE_KEY = 'frostapp_language';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly currentLanguage = signal<Language>('de');
  readonly language = this.currentLanguage.asReadonly();

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && TRANSLATIONS[saved]) {
      this.currentLanguage.set(saved);
    }
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  toggleLanguage(): void {
    const newLang = this.currentLanguage() === 'de' ? 'en' : 'de';
    this.setLanguage(newLang);
  }

  translate(key: string): string {
    const translations = TRANSLATIONS[this.currentLanguage()];
    return translations[key] || key;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }
}
