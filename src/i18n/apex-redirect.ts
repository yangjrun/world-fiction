import { defaultLocale, locales } from './config';
import { writtenForms } from './detect-locale';

// `set:html` writes this string into the document verbatim, so a `<` in a value
// would close the script element early. This escapes that one character and
// nothing else — not U+2028 or U+2029, which are also raw-newline hazards in a
// script body. Neither can appear in a BCP-47 tag, so the values here are safe
// on both counts; the escape is here because `<` is the one that would be
// reachable if this ever carried something other than locale codes.
function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, String.raw`\u003c`);
}

/**
 * The language-detection script `src/pages/index.astro` inlines into `/`.
 *
 * Inlined rather than bundled, deliberately. A bundled module script is a
 * second request on the site's most-linked URL, deferred until the document has
 * parsed, and — the deciding point — a resource that can fail on its own: an
 * edge-cached apex referencing a rotated `/_astro/*.js` hash would leave a
 * visitor with JavaScript *enabled* on a page whose only links sit inside
 * `<noscript>`, where nothing renders them. Inline, the script cannot arrive
 * separately from the page that needs it, and it redirects while the head is
 * still parsing.
 *
 * The cost is that the match order lives here as well as in `detectLocale`,
 * which reads the same preferences off an `Accept-Language` header server-side.
 * Two things hold them together: every piece of data — the locale list, the
 * fallback, and the written-form table that keeps Traditional Chinese tags off
 * Simplified — is injected from the modules that own it, so none of it can
 * drift; and `tests/i18n/apex-redirect.test.ts` executes this exact source
 * against a fake `window` and asserts, tag list by tag list, that it picks what
 * `detectLocale` picks. The duplication is pinned by an executable test, not by
 * eyeballing.
 *
 * ES5 on purpose: `is:inline` means Astro passes the source through untouched,
 * with no transpilation and no polyfills.
 */
export const apexRedirectScript = `(function (w) {
  var locales = ${inlineJson(locales)};
  var forms = ${inlineJson(writtenForms)};
  var fallback = ${inlineJson(defaultLocale)};
  var nav = w.navigator || {};
  var offered = nav.languages && nav.languages.length ? nav.languages : [nav.language];
  var target = '';
  var i, j, tag, parts, form, prefix;

  // An exact locale, or a written form the tag names outright: zh-Hant-HK is
  // Traditional however it is spelled, and zh-TW must never be answered with
  // zh-CN. Both settle here, in the visitor's own order of preference.
  for (i = 0; i < offered.length && !target; i++) {
    tag = offered[i] || '';
    for (j = 0; j < locales.length; j++) {
      if (locales[j] === tag) { target = locales[j]; break; }
    }
    if (!target) {
      parts = tag.toLowerCase().split('-');
      form = parts.length > 1 ? forms[parts[0] + '-' + parts[1]] : '';
      if (form) { target = form; }
    }
  }

  // Then language-only: zh takes the first configured zh-*.
  for (i = 0; i < offered.length && !target; i++) {
    prefix = (offered[i] || '').split('-')[0] + '-';
    for (j = 0; j < locales.length; j++) {
      if (locales[j].indexOf(prefix) === 0) { target = locales[j]; break; }
    }
  }

  // replace(), not assign(): the apex must not enter session history, or Back
  // from a locale home returns here and is bounced straight forward again.
  w.location.replace('/' + (target || fallback));
})(window);`;
