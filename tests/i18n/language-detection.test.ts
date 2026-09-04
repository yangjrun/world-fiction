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

// The site publishes Chinese twice, once per written form, so a tag that names
// its script or its region has already said which one it wants. Reducing every
// tag to its language subtag discarded that: every Traditional tag except the
// literal `zh-TW` resolved to Simplified — including `zh-Hant`, which names the
// script outright, and `zh-Hant-HK`, which is what Safari reports for a Hong
// Kong reader.
describe('Chinese written forms', () => {
  it('sends a Hant script subtag to Traditional', () => {
    expect(detectLocale('zh-Hant')).toBe('zh-TW');
    expect(detectLocale('zh-Hant-HK')).toBe('zh-TW');
    expect(detectLocale('zh-Hant-TW')).toBe('zh-TW');
  });

  it('sends a Traditional region to Traditional, whatever its case', () => {
    expect(detectLocale('zh-HK')).toBe('zh-TW');
    expect(detectLocale('zh-MO')).toBe('zh-TW');
    expect(detectLocale('zh-TW')).toBe('zh-TW');
    expect(detectLocale('zh-tw')).toBe('zh-TW');
  });

  it('sends a Hans script subtag or a Simplified region to Simplified', () => {
    expect(detectLocale('zh-Hans')).toBe('zh-CN');
    expect(detectLocale('zh-Hans-CN')).toBe('zh-CN');
    expect(detectLocale('zh-SG')).toBe('zh-CN');
    expect(detectLocale('zh-cn')).toBe('zh-CN');
  });

  it('leaves bare zh on Simplified', () => {
    // No script and no region: nothing has been said about the written form, so
    // the language-prefix pass takes the first configured zh-* as it always did.
    expect(detectLocale('zh')).toBe('zh-CN');
    expect(detectLocale('zh;q=0.9,en;q=0.8')).toBe('zh-CN');
  });

  it('settles a written form before a lower-priority exact match', () => {
    // The Safari-in-Hong-Kong header. Leaving written forms to a pass after the
    // exact one would hand this reader the English sitting at position four.
    expect(detectLocale('zh-Hant-HK,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7')).toBe('zh-TW');
    expect(detectLocale('zh-HK,zh-CN;q=0.9')).toBe('zh-TW');
  });

  it('leaves the other ten locales alone', () => {
    // The table is keyed on two subtags, so only a zh-* tag can reach it: en-HK
    // and pt-MO share a region with a Traditional entry and are unaffected.
    expect(detectLocale('en-HK')).toBe('en-US');
    expect(detectLocale('pt-MO')).toBe('pt-PT');
    expect(detectLocale('de-AT,fr-FR')).toBe('fr-FR');
  });
});

describe('Preference order', () => {
  it('takes the visitor first choice when two tags match exactly', () => {
    // Iterating the site's locale list on the outside instead of the visitor's
    // preferences answers both of these with the alphabetically earlier locale,
    // en-US and de-DE, and no single-match test in this file would notice.
    expect(detectLocale('zh-TW,en-US')).toBe('zh-TW');
    expect(detectLocale('ja-JP,de-DE')).toBe('ja-JP');
  });
});
