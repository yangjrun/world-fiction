import { locales, type Locale } from './config';
import { getTranslations } from './ui';
// The rule and its composition live in ../../astro.translations.mjs because
// astro.config.mjs needs them too, and the config loader can reach neither this
// file's `@/` alias nor Vite's import glob. Only the pure half is imported here;
// the `node:fs` reader in that module stays behind a function nothing in the app
// calls, so nothing reads a file relative to a bundle's location.
import { translatedLocalesFrom } from '../../astro.translations.mjs';
/**
 * The locales cleared to be advertised as translations.
 *
 * This is the set the site may claim as `hreflang` alternates: such a claim says a
 * URL carries this page in that language, and a locale whose bundle is still English
 * carries English under a foreign `lang`. Ten such claims per URL is a
 * duplicate-content cluster Google can discount whole, taking the locales that are
 * real translations down with the ones that are not.
 *
 * Each bundle declares its own clearance in `__status`, the same shape as the
 * `status: verified` gate every spec passes through — see ../../astro.translations.mjs
 * for why that is a declaration rather than something inferred from the copy, and
 * for what happens to a bundle that declares nothing.
 *
 * The pages themselves stay built and reachable, and the language switcher keeps all
 * eleven entries: this narrows what the site claims to a crawler, not what a reader
 * can open.
 *
 * Bundles come from `getTranslations`, the same loader the pages render from, so a
 * locale cannot be judged by a bundle other than the one it serves.
 * `tests/i18n/translated.test.ts` asserts this agrees with the `node:fs` reader
 * `astro.config.mjs` uses for the sitemap.
 */
export async function getTranslatedLocales(): Promise<Locale[]> {
  const loaded = new Map(
    await Promise.all(
      locales.map(async (locale) => [locale, await getTranslations(locale)] as const),
    ),
  );

  const load = (locale: string): Record<string, string> => {
    const bundle = loaded.get(locale as Locale);
    // Unreachable while astro.locales.mjs and ./config.ts agree, which
    // tests/i18n/astro-config.test.ts compares by value. Loud rather than a `{}`
    // that would silently read as "identical to en-US, so not translated".
    if (bundle === undefined) {
      throw new Error(`getTranslatedLocales: no bundle was loaded for "${locale}"`);
    }
    return bundle;
  };

  // Filtered back through `locales` rather than cast, so the result is typed and
  // ordered by the configured locale list rather than by the build-time copy.
  const translated = new Set(translatedLocalesFrom(load));
  return locales.filter((locale) => translated.has(locale));
}
