import { describe, it, expect } from 'vitest';

// We'll test the detectLocale logic in isolation
function detectLocale(acceptLanguage: string | null, locales: string[], defaultLocale: string): string {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.trim(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Try exact match first
  for (const { code } of languages) {
    if (locales.includes(code)) return code;
  }

  // Try language-only match
  for (const { code } of languages) {
    const lang = code.split('-')[0];
    const match = locales.find(l => l.startsWith(lang + '-'));
    if (match) return match;
  }

  return defaultLocale;
}

describe('Language detection', () => {
  const locales = ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-CN', 'zh-TW'];
  const defaultLocale = 'en-US';

  it('should return default locale when Accept-Language is null', () => {
    expect(detectLocale(null, locales, defaultLocale)).toBe('en-US');
  });

  it('should match exact locale', () => {
    expect(detectLocale('zh-CN', locales, defaultLocale)).toBe('zh-CN');
    expect(detectLocale('ja-JP', locales, defaultLocale)).toBe('ja-JP');
  });

  it('should match language prefix', () => {
    expect(detectLocale('zh', locales, defaultLocale)).toBe('zh-CN'); // First match
    expect(detectLocale('ja', locales, defaultLocale)).toBe('ja-JP');
    expect(detectLocale('de', locales, defaultLocale)).toBe('de-DE');
  });

  it('should handle quality values', () => {
    expect(detectLocale('fr-FR;q=0.9,en-US;q=0.8', locales, defaultLocale)).toBe('fr-FR');
    expect(detectLocale('en-US;q=0.5,zh-CN;q=0.9', locales, defaultLocale)).toBe('zh-CN');
  });

  it('should handle multiple languages and pick best match', () => {
    expect(detectLocale('en-GB,en;q=0.9', locales, defaultLocale)).toBe('en-US');
    expect(detectLocale('pt-BR,pt;q=0.9', locales, defaultLocale)).toBe('pt-PT');
  });

  it('should return default for unsupported language', () => {
    expect(detectLocale('ru-RU', locales, defaultLocale)).toBe('en-US');
    expect(detectLocale('ar-SA', locales, defaultLocale)).toBe('en-US');
  });

  it('should handle complex Accept-Language headers', () => {
    const complex = 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5';
    expect(detectLocale(complex, locales, defaultLocale)).toBe('fr-FR');
  });
});
