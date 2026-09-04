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
    const { all } = buildAlternates('/en-US/about', 'en-US', locales, locales, ORIGIN);
    expect(all.map((alternate) => alternate.locale)).toEqual(locales);
  });

  it('advertises only the locales that publish the page', () => {
    const publishing: Locale[] = ['en-US', 'de-DE'];
    const { all, translations } = buildAlternates(
      '/en-US/us/passport',
      'en-US',
      publishing,
      locales,
      ORIGIN,
    );

    expect(translations.map((alternate) => alternate.locale)).toEqual(['de-DE', 'en-US']);
    expect(all).toHaveLength(locales.length);
  });

  it('keeps a locale in the switcher and out of the hreflang set at once', () => {
    // The two consumers part company here, and this is the only place they do: a
    // reader who wants German still needs a route to German, and that locale's
    // home page is a better answer than an hreflang claim that 404s.
    const { all } = buildAlternates('/en-US/us/passport', 'en-US', ['en-US'], locales, ORIGIN);

    const german = all.find((alternate) => alternate.locale === 'de-DE');
    expect(german?.published).toBe(false);
    expect(german?.switcherPath).toBe('/de-DE');

    const english = all.find((alternate) => alternate.locale === 'en-US');
    expect(english?.published).toBe(true);
    expect(english?.switcherPath).toBe('/en-US/us/passport');
  });

  it('sends the switcher to the same page in a locale that publishes it', () => {
    const { all } = buildAlternates('/en-US/about', 'en-US', locales, locales, ORIGIN);
    expect(all.find((alternate) => alternate.locale === 'ja-JP')?.switcherPath).toBe('/ja-JP/about');
  });

  it('builds absolute URLs against the configured origin', () => {
    const { translations } = buildAlternates(
      '/en-US/about',
      'en-US',
      ['en-US', 'de-DE'],
      locales,
      ORIGIN,
    );
    expect(translations.map((alternate) => alternate.href)).toEqual([
      'https://example.com/de-DE/about',
      'https://example.com/en-US/about',
    ]);
  });

  it('accepts the URL object Astro.site hands it, not only a string', () => {
    const { translations } = buildAlternates(
      '/en-US/about',
      'en-US',
      ['en-US'],
      locales,
      new URL('https://passport.example/'),
    );
    expect(translations[0]?.href).toBe('https://passport.example/en-US/about');
  });

  it('points x-default at the configured default locale', () => {
    const { xDefault } = buildAlternates('/de-DE/about', 'de-DE', locales, locales, ORIGIN);
    expect(xDefault).toBe(`https://example.com/${defaultLocale}/about`);
  });

  it('drops x-default when the default locale has no such page', () => {
    // Pointing x-default at a 404 is the same error as an alternate that 404s.
    const { xDefault } = buildAlternates('/de-DE/de/passport', 'de-DE', ['de-DE'], locales, ORIGIN);
    expect(xDefault).toBeNull();
  });

  it('handles a locale home page, which carries no trailing slash', () => {
    const { all } = buildAlternates('/en-US', 'en-US', locales, locales, ORIGIN);
    expect(all.find((alternate) => alternate.locale === 'fr-FR')?.href).toBe(
      'https://example.com/fr-FR',
    );
  });

  describe('an untranslated locale is not a version of anything', () => {
    // A built page whose bundle is still byte-for-byte en-US serves English under
    // its own lang. Claiming it as an hreflang alternate is a claim about language
    // that the page does not honour, and ten such claims per URL is a
    // duplicate-content cluster Google can discount whole -- costing the locales
    // that are real translations as well as the ones that are not.
    const PUBLISHED_EVERYWHERE = locales;
    const ENGLISH_ONLY: Locale[] = ['en-US'];

    it('keeps an untranslated locale out of the hreflang set', () => {
      const { translations } = buildAlternates(
        '/de-DE/about',
        'de-DE',
        PUBLISHED_EVERYWHERE,
        ENGLISH_ONLY,
        ORIGIN,
      );
      expect(translations.map((alternate) => alternate.locale)).toEqual(['en-US']);
    });

    it('keeps it in the switcher, pointing at the page that does exist', () => {
      // The page is built and reachable; this narrowing is about what the site
      // claims to a crawler, not about hiding anything from a reader.
      const { all } = buildAlternates(
        '/de-DE/about',
        'de-DE',
        PUBLISHED_EVERYWHERE,
        ENGLISH_ONLY,
        ORIGIN,
      );

      expect(all).toHaveLength(locales.length);
      const german = all.find((alternate) => alternate.locale === 'de-DE');
      expect(german?.published).toBe(true);
      expect(german?.translated).toBe(false);
      expect(german?.switcherPath).toBe('/de-DE/about');
    });

    it('canonicalises an untranslated page to the page it duplicates', () => {
      // Absence from the sitemap is a hint; a cross-URL canonical is the
      // directive. Without it the eleven copies are undeclared duplicates.
      const { canonical } = buildAlternates(
        '/de-DE/about',
        'de-DE',
        PUBLISHED_EVERYWHERE,
        ENGLISH_ONLY,
        ORIGIN,
      );
      expect(canonical).toBe('https://example.com/en-US/about');
    });

    it('leaves a translated page canonical to itself', () => {
      const { canonical } = buildAlternates(
        '/de-DE/about',
        'de-DE',
        PUBLISHED_EVERYWHERE,
        ['en-US', 'de-DE'],
        ORIGIN,
      );
      expect(canonical).toBe('https://example.com/de-DE/about');
    });

    it('brings a locale back into the set as soon as it is translated', () => {
      // The half that proves the mechanism is live rather than merely exclusive.
      // Nothing but the translated list changes between the two calls.
      const untranslated = buildAlternates(
        '/de-DE/about',
        'de-DE',
        PUBLISHED_EVERYWHERE,
        ENGLISH_ONLY,
        ORIGIN,
      );
      const translated = buildAlternates(
        '/de-DE/about',
        'de-DE',
        PUBLISHED_EVERYWHERE,
        ['en-US', 'de-DE'],
        ORIGIN,
      );

      expect(untranslated.translations.map((a) => a.locale)).toEqual(['en-US']);
      expect(translated.translations.map((a) => a.locale)).toEqual(['de-DE', 'en-US']);
      expect(untranslated.canonical).not.toBe(translated.canonical);
      expect(translated.canonical).toBe('https://example.com/de-DE/about');
    });

    it('intersects with the locales that publish the page, rather than replacing it', () => {
      // The two narrowings compose: a document page hands in the locales with
      // verified content, and only those that are also translated may be claimed.
      const { translations } = buildAlternates(
        '/en-US/us/passport',
        'en-US',
        ['en-US', 'de-DE'],
        ['en-US', 'de-DE', 'fr-FR'],
        ORIGIN,
      );
      expect(translations.map((alternate) => alternate.locale)).toEqual(['de-DE', 'en-US']);
    });

    it('never marks a locale translated when it does not publish the page', () => {
      const { all } = buildAlternates(
        '/en-US/us/passport',
        'en-US',
        ['en-US'],
        locales,
        ORIGIN,
      );
      for (const alternate of all) {
        if (alternate.translated) expect(alternate.published).toBe(true);
      }
      expect(all.find((alternate) => alternate.locale === 'fr-FR')?.translated).toBe(false);
    });

    it('drops x-default when the default locale is the untranslated one', () => {
      // Contrived today -- en-US is the source, so it is always translated -- but
      // x-default must not point at a page that is itself a mislabelled duplicate.
      const { xDefault, canonical } = buildAlternates(
        '/de-DE/about',
        'de-DE',
        PUBLISHED_EVERYWHERE,
        ['de-DE'],
        ORIGIN,
      );
      expect(xDefault).toBeNull();
      // Nothing to defer to, so an honest self-canonical rather than a 404.
      expect(canonical).toBe('https://example.com/de-DE/about');
    });
  });

  describe('the page has to appear in its own hreflang set', () => {
    // A cluster is a set of mutual claims. One with no self-referential alternate
    // is invalid, and Google may discard the alternates for every locale in it —
    // so this is a build failure, not a rendering quirk to notice later.
    it('refuses a set that omits the locale being rendered', () => {
      expect(() => buildAlternates('/de-DE/about', 'de-DE', ['en-US'], locales, ORIGIN)).toThrow(/de-DE/);
    });

    it('refuses an empty set', () => {
      expect(() => buildAlternates('/en-US/about', 'en-US', [], locales, ORIGIN)).toThrow(/en-US/);
    });

    it('accepts a set of one when that one is the page itself', () => {
      expect(() =>
        buildAlternates('/en-US/us/passport', 'en-US', ['en-US'], locales, ORIGIN),
      ).not.toThrow();
    });
  });
});
