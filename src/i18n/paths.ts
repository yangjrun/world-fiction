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
 * Turn a prerender file path into the URL the site publishes for it.
 *
 * Two normalisations, in this order: drop the `.html` extension, then reduce a
 * trailing `/index` segment to its parent — `/index` to `/`, `/en-US/index` to
 * `/en-US`. `index.html` is the file name a server resolves a directory request
 * to, so it is never part of the address; carrying it into a locale check or a
 * redirect target invents a URL the site does not serve.
 *
 * The second step is why `src/pages/index.astro` can exist at all. The
 * prerenderer hands the middleware `/index.html`, so a check for `pathname ===
 * '/'` misses, `index` fails `isLocale`, and the apex page is replaced by a
 * 301 stub pointing at `/en-US/index` — a route with nothing behind it.
 *
 * Only a whole final segment counts, and only once: `/reindex`, `/indexes` and
 * `/index-cards` are ordinary pages, and `/index/index` reduces to `/index`
 * because only the last segment is a file name.
 *
 * The inverse case is indistinguishable from a path alone, and is left as a
 * note rather than guarded: a document slug literally named `index` would build
 * `dist/us/index.html`, normalise to `/us`, and 301 to a stub for a page that
 * does exist. No spec carries such a slug — they are `passport`, `visa` and
 * `dv-lottery` — and a slug is a content-authoring choice, not a path property.
 */
export function toRoutePath(pathname: string): string {
  const route = stripHtmlExtension(pathname).replace(/\/index$/, '');
  return route === '' ? '/' : route;
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
