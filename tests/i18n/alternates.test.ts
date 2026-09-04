import { describe, expect, it } from 'vitest';

import { buildAlternates } from '@/i18n/alternates';
import { defaultLocale, locales, type Locale } from '@/i18n/config';

/**
 * The hreflang set is the one part of the layout with real logic in it, and every
 * way it goes wrong is invisible on the rendered page: an alternate pointing at a
 * 404, an x-default pointing at one, or a cluster that never names the page it is
 * on. Google discounts the whole cluster for any of the three, so all eleven
 * locales pay for a mistake made on one.
 */
const ORIGIN = 'https://example.com';

describe('buildAlternates', () => {
  it('names every locale for the switcher, in configuration order', () => {
    const { all } = buildAlternates('/en-US/about', 'en-US', locales, ORIGIN);
    expect(all.map((alternate) => alternate.locale)).toEqual(locales);
  });

  it('advertises only the locales that publish the page', () => {
    const publishing: Locale[] = ['en-US', 'de-DE'];
    const { all, published } = buildAlternates('/en-US/us/passport', 'en-US', publishing, ORIGIN);

    expect(published.map((alternate) => alternate.locale)).toEqual(['de-DE', 'en-US']);
    expect(all).toHaveLength(locales.length);
  });

  it('keeps a locale in the switcher and out of the hreflang set at once', () => {
    // The two consumers part company here, and this is the only place they do: a
    // reader who wants German still needs a route to German, and that locale's
    // home page is a better answer than an hreflang claim that 404s.
    const { all } = buildAlternates('/en-US/us/passport', 'en-US', ['en-US'], ORIGIN);

    const german = all.find((alternate) => alternate.locale === 'de-DE');
    expect(german?.published).toBe(false);
    expect(german?.switcherPath).toBe('/de-DE');

    const english = all.find((alternate) => alternate.locale === 'en-US');
    expect(english?.published).toBe(true);
    expect(english?.switcherPath).toBe('/en-US/us/passport');
  });

  it('sends the switcher to the same page in a locale that publishes it', () => {
    const { all } = buildAlternates('/en-US/about', 'en-US', locales, ORIGIN);
    expect(all.find((alternate) => alternate.locale === 'ja-JP')?.switcherPath).toBe('/ja-JP/about');
  });

  it('builds absolute URLs against the configured origin', () => {
    const { published } = buildAlternates('/en-US/about', 'en-US', ['en-US', 'de-DE'], ORIGIN);
    expect(published.map((alternate) => alternate.href)).toEqual([
      'https://example.com/de-DE/about',
      'https://example.com/en-US/about',
    ]);
  });

  it('accepts the URL object Astro.site hands it, not only a string', () => {
    const { published } = buildAlternates(
      '/en-US/about',
      'en-US',
      ['en-US'],
      new URL('https://passport.example/'),
    );
    expect(published[0]?.href).toBe('https://passport.example/en-US/about');
  });

  it('points x-default at the configured default locale', () => {
    const { xDefault } = buildAlternates('/de-DE/about', 'de-DE', locales, ORIGIN);
    expect(xDefault).toBe(`https://example.com/${defaultLocale}/about`);
  });

  it('drops x-default when the default locale has no such page', () => {
    // Pointing x-default at a 404 is the same error as an alternate that 404s.
    const { xDefault } = buildAlternates('/de-DE/de/passport', 'de-DE', ['de-DE'], ORIGIN);
    expect(xDefault).toBeNull();
  });

  it('handles a locale home page, which carries no trailing slash', () => {
    const { all } = buildAlternates('/en-US', 'en-US', locales, ORIGIN);
    expect(all.find((alternate) => alternate.locale === 'fr-FR')?.href).toBe(
      'https://example.com/fr-FR',
    );
  });

  describe('the page has to appear in its own hreflang set', () => {
    // A cluster is a set of mutual claims. One with no self-referential alternate
    // is invalid, and Google may discard the alternates for every locale in it —
    // so this is a build failure, not a rendering quirk to notice later.
    it('refuses a set that omits the locale being rendered', () => {
      expect(() => buildAlternates('/de-DE/about', 'de-DE', ['en-US'], ORIGIN)).toThrow(/de-DE/);
    });

    it('refuses an empty set', () => {
      expect(() => buildAlternates('/en-US/about', 'en-US', [], ORIGIN)).toThrow(/en-US/);
    });

    it('accepts a set of one when that one is the page itself', () => {
      expect(() =>
        buildAlternates('/en-US/us/passport', 'en-US', ['en-US'], ORIGIN),
      ).not.toThrow();
    });
  });
});
