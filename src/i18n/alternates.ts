import { defaultLocale, locales, type Locale } from './config';
import { localizedPath } from './paths';

/**
 * One locale's view of the page being rendered.
 *
 * `href` and `switcherPath` are deliberately allowed to disagree: see
 * `buildAlternates`.
 */
export interface LocaleAlternate {
  readonly locale: Locale;
  /** Whether this locale publishes this page. */
  readonly published: boolean;
  /** Absolute URL of this page in this locale. Only meaningful if published. */
  readonly href: string;
  /** Where the language switcher sends a reader who picks this locale. */
  readonly switcherPath: string;
}

export interface AlternateSet {
  /** Every locale, in configuration order, for the language switcher. */
  readonly all: readonly LocaleAlternate[];
  /** Only the locales that publish this page, for `hreflang`. */
  readonly published: readonly LocaleAlternate[];
  /** The `x-default` URL, or `null` when the default locale has no such page. */
  readonly xDefault: string | null;
}

/**
 * The hreflang set and the language-switcher targets for one page.
 *
 * One list, two consumers, so neither can disagree with the other about where a
 * locale lives. They part company only on a locale that does not publish this
 * page: `hreflang` is a claim that a URL exists, so it names published locales
 * only, while the switcher keeps all eleven — a reader who lands on a page that
 * exists in one language still needs a route into their own, and sending them to
 * that locale's home page is a better answer than a 404.
 *
 * `x-default` follows the configured default locale so the two cannot drift, and
 * is dropped entirely when that locale does not publish the page: pointing
 * x-default at a 404 is the same error as an alternate that 404s.
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
  origin: string | URL,
): AlternateSet {
  // A page must appear in its own hreflang set. Google reads a cluster as a set
  // of mutual claims, and a page whose cluster never names itself is treated as
  // invalid — the alternates are discounted for every locale in it, not just for
  // this one. A caller that computes `availableLocales` from content queries can
  // arrive here one locale short (a slug renamed, a spec left unverified) and the
  // rendered page would look fine, so this fails the build instead.
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
      href: new URL(path, origin).href,
      switcherPath: published ? path : `/${candidate}`,
    };
  });

  return {
    all,
    published: all.filter((alternate) => alternate.published),
    xDefault: availableLocales.includes(defaultLocale)
      ? new URL(localizedPath(pathname, defaultLocale), origin).href
      : null,
  };
}
