// Build-time view of the translation bundles: which locales a translator has
// actually started on, as opposed to which locales have a file.
//
// A locale whose bundle is still byte-for-byte en-US serves English prose under
// its own `lang`, so claiming it as an `hreflang` alternate, or listing its pages
// in the sitemap, invites Google to index eleven near-duplicate English pages and
// to discount the cluster they belong to. Both of those claims are narrowed to the
// locales this module reports.
//
// Two readers, one rule. `astro.config.mjs` needs the list to filter the sitemap
// and loads inside Astro's config loader, where there is no Vite transform and no
// TS path alias -- hence a plain `.mjs` at the root, beside `astro.locales.mjs`,
// and hence `node:fs` rather than Vite's import glob. `src/i18n/translated.ts`
// needs the same list for the layout and gets it through `getTranslations`, which
// is the loader the app already uses; it imports `isTranslatedBundle` from here so
// the rule itself exists once. tests/i18n/translated.test.ts asserts the two
// readers agree.
//
// Nothing here runs at import time: `src/i18n/translated.ts` pulls this module
// into the Vite SSR graph, and a top-level `readFileSync` there would resolve
// against the bundle's location rather than the project's.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { DEFAULT_LOCALE, LOCALES } from './astro.locales.mjs';

const TRANSLATIONS_DIR = new URL('./src/i18n/translations/', import.meta.url);

/**
 * Whether `key` names a string the site renders.
 *
 * The bundle also carries a `__readme` header and a `<key>__note` beside anything
 * with a placeholder. Those are documentation written for translators, not copy:
 * a locale whose notes have been translated and whose copy has not is not a
 * translated locale, and must not be advertised as one.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isRenderedKey(key) {
  return !key.startsWith('__') && !key.endsWith('__note');
}

/**
 * Whether `bundle` has been translated away from `source`.
 *
 * True as soon as one rendered string differs, which is deliberately generous: a
 * translator works through a 120-key file over days, and a locale that is half
 * done is still a locale whose pages are worth finding. It is also the only rule
 * that cannot be gamed by coincidence in the other direction -- several strings
 * are legitimately identical in every language (`mm`, `px`, `DPI`, the comma that
 * joins two file limits), so "every string differs" would never be true.
 *
 * Compares the union of both key sets, so a bundle that grew a rendered key en-US
 * does not have counts as translated too. Key-set parity is separately asserted
 * in tests/i18n/translations.test.ts.
 *
 * @param {Record<string, string>} bundle
 * @param {Record<string, string>} source
 * @returns {boolean}
 */
export function isTranslatedBundle(bundle, source) {
  for (const key of new Set([...Object.keys(source), ...Object.keys(bundle)])) {
    if (!isRenderedKey(key)) continue;
    if (bundle[key] !== source[key]) return true;
  }
  return false;
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
 * The locales worth advertising as translations, in configured order.
 *
 * The default locale is the source every other bundle is compared against, so it
 * is always in the list; there is nothing for it to diverge from.
 *
 * Takes the loader rather than reading files itself, so the one thing both callers
 * share is this composition and not a copy of it: `readTranslatedLocales` loads
 * with `node:fs` for the config loader, `getTranslatedLocales` in
 * src/i18n/translated.ts loads through the same import glob the pages render from,
 * and a test can hand it bundles of its own to prove that a diverged locale
 * rejoins the list rather than only that an identical one stays out.
 *
 * @param {(locale: string) => Record<string, string>} load
 * @returns {string[]}
 */
export function translatedLocalesFrom(load) {
  const source = load(DEFAULT_LOCALE);
  return LOCALES.filter(
    (locale) => locale === DEFAULT_LOCALE || isTranslatedBundle(load(locale), source),
  );
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
