import { isLocale, type Locale } from './config';

/**
 * Drop a single trailing `.html` from a path.
 *
 * `build.format: 'file'` writes one `.html` per route, and during prerendering
 * Astro hands the middleware and every page the file path rather than the URL
 * the site publishes: `/en-US.html`, not `/en-US`. Read a locale segment out of
 * that unnormalised path and `isLocale('en-US.html')` is false — the locale home
 * page then looks unprefixed and gets redirected away. Advertise it in a
 * canonical or hreflang URL and the site points search engines at an address its
 * own `trailingSlash: 'never'` policy does not use.
 *
 * Only the extension goes: `/a.html/b` and `/a.html.html` keep the inner one,
 * because only the final segment is a file name.
 */
export function stripHtmlExtension(pathname: string): string {
  return pathname.replace(/\.html$/, '');
}

/**
 * Rewrite `pathname` so it points at the same page in `target`.
 *
 * The tempting one-liner, `pathname.replace(`/${current}/`, `/${target}/`)`, is
 * silently wrong here: `trailingSlash: 'never'` means a locale home page is
 * `/en-US` with no trailing slash, so the pattern matches nothing, the path
 * comes back unchanged, and every language in a switcher links to the page the
 * reader is already on. Swap the first segment instead.
 *
 * A path whose first segment is not a locale gets one prepended rather than
 * overwritten, so the pages that have not moved under `src/pages/[locale]/` yet
 * still produce usable links: `/us/passport` -> `/de-DE/us/passport`, not
 * `/de-DE/passport`. That branch is interim — once every route carries a locale
 * prefix, nothing reaches it.
 */
export function localizedPath(pathname: string, target: Locale): string {
  const segments = pathname.split('/').filter(Boolean);
  const [first] = segments;
  const rest = first !== undefined && isLocale(first) ? segments.slice(1) : segments;
  return `/${[target, ...rest].join('/')}`;
}
