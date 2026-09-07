import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';
import { getTranslatedLocales } from '@/i18n/translated';

import {
  BUNDLE_STATUSES,
  STATUS_KEY,
  isTranslatedBundle,
  readTranslatedLocales,
  translatedLocalesFrom,
} from '../../astro.translations.mjs';

/**
 * Which locales the site may advertise as translations.
 *
 * Ten of the eleven bundles are copies of en-US.json, so ten built pages per URL
 * serve English under their own `lang`. Claiming those as `hreflang` alternates, or
 * listing them in the sitemap, asks Google to index eleven near-duplicate English
 * pages and invites it to discount the cluster whole -- which costs the locales that
 * are real translations as well as the ones that are not.
 *
 * The clearance is declared, not inferred. An earlier version deep-compared each
 * bundle against en-US and called any difference a translation, which advertised a
 * German version off one changed string in 122 and left no reviewable moment at
 * which a locale started being claimed. `__status` mirrors `status: verified` on a
 * spec: a person says it is ready, and the diff shows who and when.
 */
const draft = { [STATUS_KEY]: 'draft', 'nav.home': 'All photo specs' };
const translated = { [STATUS_KEY]: 'translated', 'nav.home': 'Alle Fotovorgaben' };

describe('isTranslatedBundle', () => {
  it('reads the declaration rather than the copy', () => {
    expect(isTranslatedBundle(translated)).toBe(true);
    expect(isTranslatedBundle(draft)).toBe(false);
  });

  it('holds a bundle back even once its strings differ', () => {
    // The point of the change: a half-translated file is still a draft, and
    // advertising it is a decision somebody has to take on purpose.
    expect(isTranslatedBundle({ ...draft, 'nav.home': 'Alle Fotovorgaben' })).toBe(false);
  });

  it('advertises a bundle that is cleared even while its strings are English', () => {
    // The mirror case, and the reason this is a declaration: a language whose copy
    // legitimately matches English in most keys is still a translation if a person
    // says so.
    expect(isTranslatedBundle({ ...translated, 'nav.home': 'All photo specs' })).toBe(true);
  });

  it('refuses a bundle that declares nothing', () => {
    // Fail closed and loud. Defaulting to draft silently drops a finished language
    // out of the sitemap; defaulting to translated silently advertises an English
    // one. Neither is visible in a built page.
    expect(() => isTranslatedBundle({ 'nav.home': 'All photo specs' }, 'xx-XX.json')).toThrow(
      /xx-XX\.json/,
    );
  });

  it('refuses a status it does not recognise', () => {
    expect(() => isTranslatedBundle({ [STATUS_KEY]: 'verified' })).toThrow(new RegExp(STATUS_KEY));
    expect(() => isTranslatedBundle({ [STATUS_KEY]: 'Translated' })).toThrow();
    expect(() => isTranslatedBundle({ [STATUS_KEY]: '' })).toThrow();
  });

  it('names what to do in the failure', () => {
    expect(() => isTranslatedBundle({})).toThrow(/draft/);
    expect(() => isTranslatedBundle({})).toThrow(/translated/);
  });
});

describe('translatedLocalesFrom', () => {
  /** A loader where every locale in `cleared` declares itself translated. */
  const loaderClearing =
    (...cleared: readonly string[]) =>
    (locale: string) =>
      cleared.includes(locale) ? { ...translated } : { ...draft };

  it('names the locales that declare themselves translated, and no others', () => {
    expect(translatedLocalesFrom(loaderClearing(defaultLocale))).toEqual([defaultLocale]);
  });

  it('brings a locale back the moment its marker flips', () => {
    // The half that proves the mechanism is live rather than only exclusive.
    const cleared = translatedLocalesFrom(loaderClearing(defaultLocale, 'de-DE'));
    expect(cleared).toContain('de-DE');
    expect(cleared).toContain(defaultLocale);
    expect(cleared).not.toContain('fr-FR');
  });

  it('keeps configuration order, so the advertised set is stable', () => {
    expect(translatedLocalesFrom(loaderClearing(defaultLocale, 'zh-TW', 'de-DE'))).toEqual([
      'de-DE',
      defaultLocale,
      'zh-TW',
    ]);
  });

  it('refuses to run with the source language in draft', () => {
    // Every untranslated page canonicalises to the default locale and every
    // x-default points at it. A run that dropped it would leave the site with no
    // cluster, no sitemap and canonicals aiming at a locale it does not advertise.
    expect(() => translatedLocalesFrom(loaderClearing('de-DE'))).toThrow(
      new RegExp(defaultLocale),
    );
  });
});

describe('the bundles on disk', () => {
  const dir = fileURLToPath(new URL('../../src/i18n/translations/', import.meta.url));
  const bundles = readdirSync(dir).filter((name) => name.endsWith('.json'));

  it('every one declares a recognised status', () => {
    // A bundle added without a marker fails the build inside isTranslatedBundle;
    // this says the same thing sooner, and names every offender at once rather
    // than the first.
    expect(bundles).toHaveLength(locales.length);
    for (const name of bundles) {
      const dict: Record<string, string> = JSON.parse(readFileSync(`${dir}${name}`, 'utf8'));
      expect(BUNDLE_STATUSES, `${name} declares ${dict[STATUS_KEY]}`).toContain(dict[STATUS_KEY]);
    }
  });

  it('tells a translator what the marker is for', () => {
    // The one key in the file a translator must change and must not translate.
    const source: Record<string, string> = JSON.parse(readFileSync(`${dir}en-US.json`, 'utf8'));
    expect(source['__readme']).toContain(STATUS_KEY);
    for (const status of BUNDLE_STATUSES) {
      expect(source['__readme'], `the readme never mentions ${status}`).toContain(status);
    }
  });
});

describe('the two readers of the same rule', () => {
  // astro.config.mjs reads the bundles with node:fs, because it loads inside Astro's
  // config loader where no Vite transform exists; the layout reads them through the
  // import glob the pages render from. Different loaders, one rule -- and a sitemap
  // that disagreed with the hreflang set would be the worst of both.
  it('agree on which locales are translated', async () => {
    expect(await getTranslatedLocales()).toEqual(readTranslatedLocales());
  });

  it('report a subset of the configured locales that always includes the default', async () => {
    const cleared = await getTranslatedLocales();
    expect(cleared).toContain(defaultLocale);
    for (const locale of cleared) {
      expect(locales, `${locale} is not a configured locale`).toContain(locale);
    }
  });

  it('report them in configured order', async () => {
    const cleared = await getTranslatedLocales();
    expect(cleared).toEqual(locales.filter((locale) => cleared.includes(locale)));
  });
});
