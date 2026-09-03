import { describe, it, expect } from 'vitest';

import { detectLocale } from '@/i18n/detect-locale';

describe('Language detection', () => {
  it('should return default locale when Accept-Language is null', () => {
    expect(detectLocale(null)).toBe('en-US');
  });

  it('should match exact locale', () => {
    expect(detectLocale('zh-CN')).toBe('zh-CN');
    expect(detectLocale('ja-JP')).toBe('ja-JP');
  });

  it('should match language prefix', () => {
    expect(detectLocale('zh')).toBe('zh-CN'); // First match
    expect(detectLocale('ja')).toBe('ja-JP');
    expect(detectLocale('de')).toBe('de-DE');
  });

  it('should handle quality values', () => {
    expect(detectLocale('fr-FR;q=0.9,en-US;q=0.8')).toBe('fr-FR');
    expect(detectLocale('en-US;q=0.5,zh-CN;q=0.9')).toBe('zh-CN');
  });

  it('should handle multiple languages and pick best match', () => {
    expect(detectLocale('en-GB,en;q=0.9')).toBe('en-US');
    expect(detectLocale('pt-BR,pt;q=0.9')).toBe('pt-PT');
  });

  it('should return default for unsupported language', () => {
    expect(detectLocale('ru-RU')).toBe('en-US');
    expect(detectLocale('ar-SA')).toBe('en-US');
  });

  it('should handle complex Accept-Language headers', () => {
    const complex = 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5';
    expect(detectLocale(complex)).toBe('fr-FR');
  });
});
