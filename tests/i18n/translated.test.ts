import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';
import { getTranslatedLocales } from '@/i18n/translated';

import {
  isRenderedKey,
  isTranslatedBundle,
  readTranslatedLocales,
  translatedLocalesFrom,
} from '../../astro.translations.mjs';

/**
 * Which locales the site may advertise as translations.
 *
 * Ten of the eleven bundles are copies of en-US.json, so ten built pages per URL
 * serve English under their own `lang`. Claiming those as `hreflang` alternates,
 * or listing them in the sitemap, asks Google to index eleven near-duplicate
 * English pages and invites it to discount the cluster whole -- which costs the
 * locales that are real translations as well as the ones that are not.
 *
 * The rule is deliberately mechanical: a locale is translated once one rendered
 * string differs from the source bundle. Nobody has to remember to add a locale to
 * a list, and nobody can forget to remove one.
 */
const SOURCE = { 'nav.home': 'All photo specs', 'nav.about': 'About' };

describe('isTranslatedBundle', () => {
  it('calls an identical bundle untranslated', () => {
    expect(isTranslatedBundle({ ...SOURCE }, SOURCE)).toBe(false);
  });

  it('calls a bundle with one differing string translated', () => {
    // Generous on purpose: a translator works through 120 keys over days, and a
    // half-translated locale is still one whose pages are worth finding.
    expect(isTranslatedBundle({ ...SOURCE, 'nav.about': 'Über uns' }, SOURCE)).toBe(true);
  });

  it('ignores the translator documentation', () => {
    // __readme and <key>__note are notes to a translator, not copy. A locale whose
    // notes have been localised and whose strings have not is not translated, and
    // must not be advertised as though it were.
    const source = { ...SOURCE, __readme: 'Read me', 'nav.about__note': 'A nav label.' };
    const bundle = { ...source, __readme: 'Lies mich', 'nav.about__note': 'Ein Navi-Label.' };
    expect(isTranslatedBundle(bundle, source)).toBe(false);
  });

  it('notices a rendered key the source does not have', () => {
    // Key-set parity is asserted in tests/i18n/translations.test.ts; comparing the
    // union means this cannot be fooled by a bundle that only adds keys.
    expect(isTranslatedBundle({ ...SOURCE, 'nav.extra': 'Mehr' }, SOURCE)).toBe(true);
  });

  it('notices a rendered key the bundle dropped', () => {
    expect(isTranslatedBundle({ 'nav.home': 'All photo specs' }, SOURCE)).toBe(true);
  });
});

describe('isRenderedKey', () => {
  it('separates copy from the documentation beside it', () => {
    expect(isRenderedKey('nav.home')).toBe(true);
    expect(isRenderedKey('privacy.ads-p2')).toBe(true);
    expect(isRenderedKey('__readme')).toBe(false);
    expect(isRenderedKey('privacy.ads-p2__note')).toBe(false);
  });
});

describe('translatedLocalesFrom', () => {
  /** A loader where every locale in `diverged` has one string of its own. */
  const loaderWhere = (...diverged: readonly string[]) => (locale: string) =>
    diverged.includes(locale) ? { ...SOURCE, 'nav.about': `About in ${locale}` } : { ...SOURCE };

  it('names the default locale even though nothing diverges from it', () => {
    // It is the bundle every other one is compared against; there is nothing for
    // it to differ from, and a site that advertises no locale at all is worse
    // than one that advertises its source language.
    expect(translatedLocalesFrom(loaderWhere())).toEqual([defaultLocale]);
  });

  it('names nothing else while every bundle is a copy', () => {
    // Today's state, and the state this fix exists for.
    expect(translatedLocalesFrom(loaderWhere())).toHaveLength(1);
  });

  it('brings a locale back the moment its bundle diverges', () => {
    // The half that proves the mechanism is live rather than only exclusive: a
    // translator commits one string and the locale rejoins with no list edited.
    const translated = translatedLocalesFrom(loaderWhere('de-DE'));
    expect(translated).toContain('de-DE');
    expect(translated).toContain(defaultLocale);
    expect(translated).not.toContain('fr-FR');
  });

  it('keeps configuration order, so the advertised set is stable', () => {
    const translated = translatedLocalesFrom(loaderWhere('zh-TW', 'de-DE'));
    expect(translated).toEqual(['de-DE', defaultLocale, 'zh-TW']);
  });
});

describe('the two readers of the same rule', () => {
  // astro.config.mjs reads the bundles with node:fs, because it loads inside
  // Astro's config loader where no Vite transform exists; the layout reads them
  // through the import glob the pages render from. Different loaders, one rule --
  // and a sitemap that disagreed with the hreflang set would be the worst of both.
  it('agree on which locales are translated', async () => {
    expect(await getTranslatedLocales()).toEqual(readTranslatedLocales());
  });

  it('report a subset of the configured locales that always includes the default', async () => {
    const translated = await getTranslatedLocales();
    expect(translated).toContain(defaultLocale);
    for (const locale of translated) {
      expect(locales, `${locale} is not a configured locale`).toContain(locale);
    }
  });

  it('report them in configured order', async () => {
    const translated = await getTranslatedLocales();
    expect(translated).toEqual(locales.filter((locale) => translated.includes(locale)));
  });
});
