import { describe, it, expect, beforeEach } from 'vitest';
import { locales } from '@/i18n/config';
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

  /** Balanced, non-nested `{em}` / `{/em}` markers, in order. No regex: the
   *  scan reports the three ways a translator breaks a pair. */
  function emphasisMarkersAreBalanced(value: string): boolean {
    let index = 0;
    let open = false;

    while (index < value.length) {
      if (value.startsWith('{em}', index)) {
        if (open) return false; // nested
        open = true;
        index += '{em}'.length;
      } else if (value.startsWith('{/em}', index)) {
        if (!open) return false; // stray closer
        open = false;
        index += '{/em}'.length;
      } else {
        index += 1;
      }
    }

    return !open; // unclosed opener
  }

  it('carries inline emphasis as balanced placeholders and no raw markup', async () => {
    // The page maps `{em}…{/em}` onto real <em> elements and interpolates every
    // chunk as text, so a raw `<` in a translated value can only ever render as
    // visible junk — and an unbalanced pair loses the emphasis silently. Asserted
    // across every locale, not just the source one: ten bundles are still to be
    // written by translators who never see this compiled.
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const key of paragraphKeys) {
        const value = required(dict, key);
        expect(value.includes('<'), `${locale} ${key} carries a raw <`).toBe(false);
        expect(value.includes('>'), `${locale} ${key} carries a raw >`).toBe(false);
        expect(emphasisMarkersAreBalanced(value), `${locale} ${key} has unbalanced {em}`).toBe(
          true,
        );
      }
    }
  });

  it('still emphasises something in the source copy', async () => {
    // "including hair" is the whole distinction between this tool and a face
    // crop. Which paragraph carries it is a translator's choice; dropping the
    // emphasis from all three is a copy regression, and the balance check above
    // is happy with zero pairs.
    const dict = await getTranslations('en-US');
    const emphasised = paragraphKeys.filter((key) => required(dict, key).includes('{em}'));
    expect(emphasised.length).toBeGreaterThan(0);
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
