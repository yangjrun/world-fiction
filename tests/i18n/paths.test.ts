import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';
import { localizedPath, stripHtmlExtension, toRoutePath } from '@/i18n/paths';

// Both helpers exist because of the same config pair: `trailingSlash: 'never'`
// with `build.format: 'file'`. That combination means the URL a page is served
// at (`/en-US`, `/en-US/us/passport`) and the path Astro hands the code during
// prerendering (`/en-US.html`, `/en-US/us/passport.html`) are different strings,
// and every locale-aware URL in the site is built from one of them.

describe('stripHtmlExtension', () => {
  it('drops the extension from a prerendered locale home path', () => {
    // The case that broke the middleware: `isLocale('en-US.html')` is false, so
    // the locale home page looked unprefixed and was redirected away.
    expect(stripHtmlExtension('/en-US.html')).toBe('/en-US');
  });

  it('drops the extension from a nested page path', () => {
    expect(stripHtmlExtension('/zh-CN/about.html')).toBe('/zh-CN/about');
    expect(stripHtmlExtension('/en-US/us/passport.html')).toBe('/en-US/us/passport');
  });

  it('leaves a path that has no extension alone', () => {
    expect(stripHtmlExtension('/en-US')).toBe('/en-US');
    expect(stripHtmlExtension('/en-US/us/passport')).toBe('/en-US/us/passport');
    expect(stripHtmlExtension('/')).toBe('/');
    expect(stripHtmlExtension('')).toBe('');
  });

  it('only strips the final segment, and only once', () => {
    // Only the last segment is a file name, and `.html.html` means a file
    // literally named `x.html`.
    expect(stripHtmlExtension('/a.html/b')).toBe('/a.html/b');
    expect(stripHtmlExtension('/a.html.html')).toBe('/a.html');
  });

  it('does not strip a lookalike extension', () => {
    expect(stripHtmlExtension('/en-US/report.htm')).toBe('/en-US/report.htm');
    expect(stripHtmlExtension('/en-US/sitemap.xml')).toBe('/en-US/sitemap.xml');
  });
});

describe('toRoutePath', () => {
  it('reduces a prerendered index page to the root', () => {
    // The case that kept `src/pages/index.astro` from existing at all: the
    // middleware is handed `/index.html`, so a `pathname === '/'` check misses,
    // `index` fails `isLocale`, and the apex page is replaced by a 301 stub
    // pointing at `/en-US/index` — a route with nothing behind it.
    expect(toRoutePath('/index.html')).toBe('/');
  });

  it('reduces a nested index page to its parent', () => {
    expect(toRoutePath('/en-US/index.html')).toBe('/en-US');
    expect(toRoutePath('/en-US/us/index.html')).toBe('/en-US/us');
  });

  it('still drops the extension from a page that is not an index', () => {
    expect(toRoutePath('/en-US.html')).toBe('/en-US');
    expect(toRoutePath('/zh-CN/about.html')).toBe('/zh-CN/about');
  });

  it('leaves a segment that merely contains "index" alone', () => {
    // `index.html` is only special as a whole file name; these are ordinary
    // pages that happen to spell it inside a longer segment.
    expect(toRoutePath('/en-US/reindex.html')).toBe('/en-US/reindex');
    expect(toRoutePath('/en-US/indexes.html')).toBe('/en-US/indexes');
    expect(toRoutePath('/en-US/index-cards.html')).toBe('/en-US/index-cards');
    expect(toRoutePath('/en-US/index/passport.html')).toBe('/en-US/index/passport');
  });

  it('reduces only the final segment, and only once', () => {
    expect(toRoutePath('/en-US/index/index.html')).toBe('/en-US/index');
  });

  it('is a no-op on a URL the site already publishes', () => {
    expect(toRoutePath('/')).toBe('/');
    expect(toRoutePath('/en-US')).toBe('/en-US');
    expect(toRoutePath('/en-US/us/passport')).toBe('/en-US/us/passport');
  });

  it('never returns an empty path', () => {
    // An empty return would fail the middleware's `route === '/'` check and
    // rejoin as `/en-US` + `''`, sending the apex back into a 301.
    expect(toRoutePath('/index')).toBe('/');
    expect(toRoutePath('')).toBe('/');
  });
});

describe('localizedPath', () => {
  it('swaps the locale on a locale home path with no trailing slash', () => {
    expect(localizedPath('/en-US', 'zh-CN')).toBe('/zh-CN');
  });

  it('swaps the locale on a nested path and keeps the rest', () => {
    expect(localizedPath('/en-US/us/passport', 'zh-CN')).toBe('/zh-CN/us/passport');
    expect(localizedPath('/zh-TW/about', 'de-DE')).toBe('/de-DE/about');
  });

  it('returns the locale root for an empty path', () => {
    expect(localizedPath('/', 'zh-CN')).toBe('/zh-CN');
    expect(localizedPath('', 'zh-CN')).toBe('/zh-CN');
  });

  it('is a no-op when the target is the locale already in the path', () => {
    expect(localizedPath('/en-US', 'en-US')).toBe('/en-US');
    expect(localizedPath('/en-US/us/passport', 'en-US')).toBe('/en-US/us/passport');
  });

  it('never emits a trailing slash', () => {
    // `trailingSlash: 'never'`: a trailing slash costs a redirect hop or 404s.
    for (const locale of locales) {
      expect(localizedPath('/', locale)).not.toMatch(/\/$/);
      expect(localizedPath('/en-US', locale)).not.toMatch(/\/$/);
      expect(localizedPath('/en-US/about', locale)).not.toMatch(/\/$/);
    }
  });

  it('round-trips every configured locale, home and nested', () => {
    for (const from of locales) {
      for (const to of locales) {
        expect(localizedPath(`/${from}`, to)).toBe(`/${to}`);
        expect(localizedPath(`/${from}/us/passport`, to)).toBe(`/${to}/us/passport`);
      }
    }
  });

  it('would be broken by the string replace it replaces', () => {
    // The defect this function exists to avoid: `/en-US` has no trailing slash,
    // so the pattern matches nothing and the caller gets the current path back
    // — every language in the switcher then links to the page you are on.
    const pathname = '/en-US';
    expect(pathname.replace(`/${defaultLocale}/`, '/zh-CN/')).toBe(pathname);
    expect(localizedPath(pathname, 'zh-CN')).not.toBe(pathname);
  });

  it('prepends a locale when the path has none — interim behaviour', () => {
    // Reached only by the pages that have not moved under `src/pages/[locale]/`
    // yet. Overwriting the first segment instead would drop it, turning
    // `/us/passport` into `/de-DE/passport`. Once every route carries a locale
    // prefix, nothing reaches this branch and these cases become moot.
    expect(localizedPath('/us/passport', 'de-DE')).toBe('/de-DE/us/passport');
    expect(localizedPath('/about', 'ja-JP')).toBe('/ja-JP/about');
  });

  it('does not mistake a locale-shaped segment further along the path', () => {
    expect(localizedPath('/us/en-US/passport', 'de-DE')).toBe('/de-DE/us/en-US/passport');
  });

  it('rejects a near-miss prefix rather than treating it as a locale', () => {
    // `xx-YY` is not configured, so it is content, not a prefix to overwrite.
    expect(localizedPath('/xx-YY/about', 'de-DE')).toBe('/de-DE/xx-YY/about');
    expect(localizedPath('/en/about', 'de-DE')).toBe('/de-DE/en/about');
  });
});
