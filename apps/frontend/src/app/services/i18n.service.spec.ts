import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [I18nService],
    });
    service = TestBed.inject(I18nService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have German as default language', () => {
    expect(service.getCurrentLanguage()).toBe('de');
  });

  it('should load saved language from localStorage', () => {
    // Set language in localStorage before creating service
    localStorage.setItem('frostapp_language', 'en');
    
    // Create new instance to test constructor loading
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [I18nService],
    });
    const newService = TestBed.inject(I18nService);
    
    expect(newService.getCurrentLanguage()).toBe('en');
  });

  it('should change language', () => {
    service.setLanguage('en');
    
    expect(service.getCurrentLanguage()).toBe('en');
  });

  it('should persist language to localStorage', () => {
    service.setLanguage('en');
    
    expect(localStorage.getItem('frostapp_language')).toBe('en');
  });

  it('should toggle language between de and en', () => {
    expect(service.getCurrentLanguage()).toBe('de');
    
    service.toggleLanguage();
    expect(service.getCurrentLanguage()).toBe('en');
    
    service.toggleLanguage();
    expect(service.getCurrentLanguage()).toBe('de');
  });

  it('should translate German keys correctly', () => {
    expect(service.translate('fridge.title')).toBe('Gefrierschrank');
    expect(service.translate('shelf.title')).toBe('Fach');
    expect(service.translate('item.title')).toBe('Gefriergut');
    expect(service.translate('item.depositDate')).toBe('Einfrierdatum');
  });

  it('should translate English keys correctly', () => {
    service.setLanguage('en');
    
    expect(service.translate('fridge.title')).toBe('Fridge');
    expect(service.translate('shelf.title')).toBe('Shelf');
    expect(service.translate('item.title')).toBe('Frost Item');
    expect(service.translate('item.depositDate')).toBe('Deposit Date');
  });

  it('should return key if translation not found', () => {
    expect(service.translate('nonexistent.key')).toBe('nonexistent.key');
  });

  it('should expose language as readonly signal', () => {
    const language = service.language;
    
    expect(language()).toBe('de');
    
    service.setLanguage('en');
    expect(language()).toBe('en');
  });
});
