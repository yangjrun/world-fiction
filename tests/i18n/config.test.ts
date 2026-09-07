import { describe, it, expect } from 'vitest';
import { languages, locales, defaultLocale } from '@/i18n/config';

describe('i18n configuration', () => {
  it('should define all 11 locales', () => {
    expect(locales).toHaveLength(11);
    expect(locales).toContain('de-DE');
    expect(locales).toContain('en-US');
    expect(locales).toContain('es-ES');
    expect(locales).toContain('fr-FR');
    expect(locales).toContain('it-IT');
    expect(locales).toContain('ja-JP');
    expect(locales).toContain('ko-KR');
    expect(locales).toContain('nl-NL');
    expect(locales).toContain('pt-PT');
    expect(locales).toContain('zh-CN');
    expect(locales).toContain('zh-TW');
  });

  it('should set en-US as default locale', () => {
    expect(defaultLocale).toBe('en-US');
  });

  it('should have language names and text direction for all locales', () => {
    locales.forEach(locale => {
      expect(languages[locale]).toBeDefined();
      expect(languages[locale].name).toBeTruthy();
      expect(languages[locale].dir).toBe('ltr');
    });
  });

  it('should have correct native names', () => {
    expect(languages['de-DE'].name).toBe('Deutsch');
    expect(languages['en-US'].name).toBe('English');
    expect(languages['zh-CN'].name).toBe('简体中文');
    expect(languages['ja-JP'].name).toBe('日本語');
  });
});
