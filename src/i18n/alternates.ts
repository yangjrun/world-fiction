import { defaultLocale, locales, type Locale } from './config';
import { localizedPath } from './paths';

/**
 * One locale's view of the page being rendered.
 *
 * `href` and `switcherPath` are deliberately allowed to disagree, and so are
 * `published` and `translated`: see `buildAlternates`.
 */
export interface LocaleAlternate {
  readonly locale: Locale;
  /** Whether this locale has this page built. */
  readonly published: boolean;
  /**
   * Whether this locale's copy of this page is a translation of it, rather than
   * the source language served under a foreign `lang`. Never true unless
   * `published` is.
   */
  readonly translated: boolean;
  /** Absolute URL of this page in this locale. Only meaningful if published. */
  readonly href: string;
  /** Where the language switcher sends a reader who picks this locale. */
  readonly switcherPath: string;
}

export interface AlternateSet {
  /** Every locale, in configuration order, for the language switcher. */
  readonly all: readonly LocaleAlternate[];
  /** Only the locales whose copy of this page is a translation, for `hreflang`. */
  readonly translations: readonly LocaleAlternate[];
  /** The `x-default` URL, or `null` when the default locale has no such page. */
  readonly xDefault: string | null;
  /** The URL this page declares canonical, which is not always its own. */
  readonly canonical: string;
}

/**
 * The hreflang set, the canonical URL and the language-switcher targets for one
 * page.
 *
 * One list, three consumers, so none of them can disagree with the others about
 * where a locale lives. They part company on two distinctions, both deliberate.
 *
 * A locale that does not publish this page is kept in the switcher and out of
 * `hreflang`: the latter is a claim that a URL exists, while a reader who lands on
 * a page that exists in one language still needs a route into their own, and that
 * locale's home page is a better answer than a 404.
 *
 * A locale that publishes this page but has not been translated is likewise kept
 * in the switcher and out of `hreflang`, for the mirror-image reason: the URL
 * exists, but what it serves is the source language under a foreign `lang`.
 * Claiming it is a translation invites Google to index eleven near-duplicate pages
 * and to discount the cluster they belong to, which costs the locales that are
 * real translations as well as the ones that are not. Such a page is not a version
 * of anything, so it canonicalises to the page it duplicates rather than to
 * itself — which is what keeps it out of the index, where omission from the
 * sitemap is only a hint. Nothing about it stops being built or reachable.
 *
 * `x-default` follows the configured default locale so the two cannot drift, and
 * is dropped entirely when that locale has no translated copy of the page:
 * pointing x-default at a 404, or at English mislabelled as German, is the same
 * class of error as an alternate that does it.
 *
 * A module of its own rather than frontmatter inside `BaseLayout.astro`, because
 * this is the layout's one piece of real logic and an `.astro` file cannot be
 * unit-tested here — `vitest.config.ts` runs plain vitest, with no Astro compiler
 * in front of it. The same reason `src/lib/specs-locale.ts` sits apart from
 * `src/lib/specs.ts`.
 */
export function buildAlternates(
  pathname: string,
  locale: Locale,
  availableLocales: readonly Locale[],
  translatedLocales: readonly Locale[],
  origin: string | URL,
): AlternateSet {
  // A page must appear in the set of locales that publish it, because it does:
  // this is a claim about which pages the build wrote, and the page making the
  // claim is one of them. A caller that computes `availableLocales` from content
  // queries can arrive here one locale short (a slug renamed, a spec left
  // unverified) and the rendered page would look fine, so this fails the build.
  //
  // Deliberately not asserted for `translatedLocales`: a page in an untranslated
  // locale is legitimately absent from its own hreflang set, and says so through
  // `canonical` instead.
  if (!availableLocales.includes(locale)) {
    throw new Error(
      `buildAlternates: the hreflang set for ${pathname} omits its own locale ` +
        `"${locale}" (given: ${availableLocales.join(', ') || 'none'}). ` +
        `availableLocales must contain the locale of the page being rendered.`,
    );
  }

  const all = locales.map((candidate) => {
    const path = localizedPath(pathname, candidate);
    const published = availableLocales.includes(candidate);
    return {
      locale: candidate,
      published,
      translated: published && translatedLocales.includes(candidate),
      href: new URL(path, origin).href,
      switcherPath: published ? path : `/${candidate}`,
    };
  });

  const translations = all.filter((alternate) => alternate.translated);
  const xDefault = translations.some((alternate) => alternate.locale === defaultLocale)
    ? new URL(localizedPath(pathname, defaultLocale), origin).href
    : null;
  // The same expression the entry for this locale in `all` was built from, so the
  // canonical URL and the page's own alternate can never disagree.
  const self = new URL(localizedPath(pathname, locale), origin).href;

  return {
    all,
    translations,
    xDefault,
    // Falls back to itself when the default locale has no translated copy of this
    // page: an honest duplicate beats a canonical pointing at a 404.
    canonical: translatedLocales.includes(locale) ? self : (xDefault ?? self),
  };
}
