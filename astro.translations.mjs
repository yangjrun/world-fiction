// Build-time view of the translation bundles: which locales are cleared to be
// advertised as translations.
//
// A locale whose bundle is still English serves English prose under its own `lang`,
// so claiming it as an `hreflang` alternate, or listing its pages in the sitemap,
// invites Google to index eleven near-duplicate English pages and to discount the
// cluster they belong to. Both of those claims are narrowed to the locales this
// module reports.
//
// The clearance is a declaration, not an inference. This used to deep-compare each
// bundle against en-US.json and call any difference a translation, which meant one
// changed string out of 122 advertised a German version of 121 English ones -- and
// meant nobody could tell, from a diff, when a locale started being advertised. It
// now reads a `__status` key out of the bundle, mirroring the `status: verified`
// gate every spec passes through: advertising a language is a deliberate human act,
// visible in review, and never a side effect of editing copy.
//
// Two readers, one rule. `astro.config.mjs` needs the list to filter the sitemap and
// loads inside Astro's config loader, where there is no Vite transform and no TS
// path alias -- hence a plain `.mjs` at the root, beside `astro.locales.mjs`, and
// hence `node:fs`. `src/i18n/translated.ts` needs the same list for the layout and
// reads through the import glob the pages render from. Both call
// `translatedLocalesFrom`, and tests/i18n/translated.test.ts asserts they agree.
//
// Nothing here runs at import time: src/i18n/translated.ts pulls this module into
// the Vite SSR graph, and a top-level `readFileSync` there would resolve against the
// bundle's location rather than the project's. One consequence worth knowing: the
// sitemap's copy of this list is computed when Astro loads its config, so editing a
// `__status` during `astro dev` moves nothing until the config reloads.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { DEFAULT_LOCALE, LOCALES } from './astro.locales.mjs';

const TRANSLATIONS_DIR = new URL('./src/i18n/translations/', import.meta.url);

/** The key each bundle declares its clearance in. */
export const STATUS_KEY = '__status';

/**
 * Every clearance a bundle may declare.
 *
 * `draft` is the honest state of a bundle that is still English, or part way
 * through: the pages build and a reader can open them, and nothing claims they are
 * a translation. `translated` is a person saying it is ready to be advertised.
 */
export const BUNDLE_STATUSES = ['draft', 'translated'];

/**
 * Whether `bundle` is cleared to be advertised as a translation.
 *
 * Throws on a missing or unrecognised `__status` rather than defaulting either way.
 * Defaulting to `draft` would silently drop a finished language out of the sitemap;
 * defaulting to `translated` would silently advertise an English one. A build that
 * dies naming the file is the only outcome that cannot ship wrong.
 *
 * @param {Record<string, string>} bundle
 * @param {string} [label] Names the bundle in the failure.
 * @returns {boolean}
 */
export function isTranslatedBundle(bundle, label = 'a translation bundle') {
  const status = bundle[STATUS_KEY];
  if (!BUNDLE_STATUSES.includes(status)) {
    throw new Error(
      `${label} declares ${STATUS_KEY} ${JSON.stringify(status)}; ` +
        `it must be one of ${BUNDLE_STATUSES.map((s) => JSON.stringify(s)).join(', ')}. ` +
        `Set "draft" until the strings in it have been translated, then "translated" ` +
        `to advertise that locale in the hreflang set and the sitemap.`,
    );
  }
  return status === 'translated';
}

/**
 * One locale's bundle, read straight off disk.
 *
 * @param {string} locale
 * @returns {Record<string, string>}
 */
export function readBundle(locale) {
  const path = fileURLToPath(new URL(`${locale}.json`, TRANSLATIONS_DIR));
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * The locales cleared to be advertised as translations, in configured order.
 *
 * Takes the loader rather than reading files itself, so the one thing both callers
 * share is this composition and not a copy of it -- and so a test can hand it
 * bundles of its own to prove that a locale rejoins the list when its marker flips,
 * rather than only that a draft one stays out.
 *
 * @param {(locale: string) => Record<string, string>} load
 * @returns {string[]}
 */
export function translatedLocalesFrom(load) {
  const translated = LOCALES.filter((locale) =>
    isTranslatedBundle(load(locale), `${locale}.json`),
  );

  // The source language is the fallback every untranslated locale canonicalises to
  // and the target of every x-default. A site advertising no locale at all has no
  // cluster, no sitemap and no canonical worth following.
  if (!translated.includes(DEFAULT_LOCALE)) {
    throw new Error(
      `${DEFAULT_LOCALE}.json declares ${STATUS_KEY} "draft", but it is the source ` +
        `bundle every other locale falls back to and must be "translated".`,
    );
  }

  return translated;
}

/**
 * The translated locales, read off disk. Used by astro.config.mjs, which loads
 * inside Astro's config loader and has no Vite transform available.
 *
 * @returns {string[]}
 */
export function readTranslatedLocales() {
  return translatedLocalesFrom(readBundle);
}
