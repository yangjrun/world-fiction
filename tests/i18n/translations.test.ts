import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslations, getTranslations } from '@/i18n/ui';

describe('Translation system', () => {
  it('should load English translations', async () => {
    const dict = await getTranslations('en-US');
    expect(dict['nav.home']).toBe('All photo specs');
    expect(dict['nav.about']).toBe('About');
  });

  it('should return key if translation missing', async () => {
    const t = useTranslations('en-US');
    await t.load();
    expect(t.t('non.existent.key')).toBe('non.existent.key');
  });

  it('should interpolate parameters', async () => {
    const t = useTranslations('en-US');
    await t.load();
    const result = t.t('editor.heading', { documentName: 'US passport' });
    expect(result).toBe('Make your US passport');
  });

  it('should handle multiple parameters', async () => {
    const t = useTranslations('en-US');
    await t.load();
    // Assuming we have a key like "greeting": "Hello {name}, welcome to {place}"
    const result = t.t('test.greeting', { name: 'Alice', place: 'Tokyo' });
    expect(result).toContain('Alice');
    expect(result).toContain('Tokyo');
  });

  it('should handle repeated parameters', async () => {
    const t = useTranslations('en-US');
    await t.load();
    const result = t.t('test.repeated', { name: 'Bob' });
    expect(result).toBe('Hello Bob, goodbye Bob');
  });
});

/**
 * The home page is the first page that renders its whole body from the bundle,
 * so these guard the two ways that goes silently wrong: body copy dropping back
 * to hardcoded English (the keys disappear and `t()` renders the bare key), and
 * the document head being collapsed onto the on-page headings.
 */
describe('Home page translations', () => {
  function required(dict: Record<string, string>, key: string): string {
    const value = dict[key];
    if (value === undefined) throw new Error(`missing translation key: ${key}`);
    return value;
  }

  const paragraphKeys = ['home.how-p1', 'home.how-p2', 'home.how-p3'];

  it('carries the how-it-works body copy as keys, not hardcoded prose', async () => {
    const dict = await getTranslations('en-US');
    for (const key of paragraphKeys) {
      expect(required(dict, key).length).toBeGreaterThan(100);
    }
  });

  it('keeps the emphasis that the measurement explanation turns on', async () => {
    // "including hair" is the whole distinction between this tool and a face
    // crop, so the page renders these paragraphs with set:html rather than as
    // text. Which paragraph carries the <em> is a translator's choice; losing
    // it altogether is a copy regression.
    const dict = await getTranslations('en-US');
    const withEmphasis = paragraphKeys.filter((key) => {
      const text = required(dict, key);
      return text.includes('<em>') && text.includes('</em>');
    });
    expect(withEmphasis.length).toBeGreaterThan(0);
  });

  it('keeps the document-head strings separate from the on-page headings', async () => {
    // home.subtitle is 210 characters and home.title is not the tuned SEO
    // title; reusing either in <head> ships a description far past the 140-170
    // window src/content.config.ts enforces for every other page.
    const dict = await getTranslations('en-US');
    const metaTitle = required(dict, 'home.meta-title');
    const metaDescription = required(dict, 'home.meta-description');

    expect(metaTitle).not.toBe(required(dict, 'home.title'));
    expect(metaDescription).not.toBe(required(dict, 'home.subtitle'));

    expect(metaTitle.length).toBeLessThanOrEqual(70);
    expect(metaDescription.length).toBeGreaterThanOrEqual(50);
    expect(metaDescription.length).toBeLessThanOrEqual(170);
  });
});
