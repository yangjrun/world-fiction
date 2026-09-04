import { inlineJson } from '@/lib/inline-json';

import { defaultLocale, locales } from './config';
import { writtenForms } from './detect-locale';

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

  // One cascade per tag, in the visitor's own order of preference: an exact
  // locale, then the written form the tag names (zh-Hant-HK is Traditional
  // however it is spelled), then the language on its own. The first tag that
  // resolves at all wins.
  //
  // Per tag, not a pass per rule: every exact match first sends a Hong Kong
  // reader offering zh-Hant-HK,zh-HK,zh,en-US to the English sitting fourth,
  // and every written form first sends en-HK,en,zh-HK to Chinese. Mirror images
  // of one fault. Walking the list once, best match per tag, answers both.
  for (i = 0; i < offered.length; i++) {
    tag = offered[i] || '';

    for (j = 0; j < locales.length; j++) {
      if (locales[j] === tag) { target = locales[j]; break; }
    }
    if (target) { break; }

    parts = tag.toLowerCase().split('-');
    if (parts.length > 1) {
      form = forms[parts[0] + '-' + parts[1]];
      if (form) { target = form; break; }
    }

    // Case-sensitive, like the exact step and like detectLocale: a lower-cased
    // prefix here would answer ZH-QQ with zh-CN while the reference answers
    // en-US, and the two must not disagree.
    prefix = tag.split('-')[0] + '-';
    for (j = 0; j < locales.length; j++) {
      if (locales[j].indexOf(prefix) === 0) { target = locales[j]; break; }
    }
    if (target) { break; }
  }

  // replace(), not assign(): the apex must not enter session history, or Back
  // from a locale home returns here and is bounced straight forward again.
  w.location.replace('/' + (target || fallback));
})(window);`;
