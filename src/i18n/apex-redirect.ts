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
  var provisional = '';
  var i, j, tag, parts, language, precise, form, prefix;

  // Walk the visitor's list once, in their order of preference. A tag that names
  // a locale precisely — an exact match, or a written form out of the table above
  // — settles it where it stands. A tag that only shares a language with
  // something published is a guess, so it is held rather than returned.
  //
  // Per tag, because either whole-list pass order inverts somebody's
  // preferences: every exact match first sends a Hong Kong reader offering
  // zh-Hant-HK,zh-HK,zh,en-US to the English sitting fourth, and every written
  // form first sends en-HK,en,zh-HK to Chinese.
  //
  // Held, not returned, because returning the guess consumed the rest of the
  // list: Chrome and Edge both offer a plain "Chinese" alongside "Chinese
  // (Traditional)", so zh,zh-TW is a shape readers really send, and zh resolving
  // to zh-CN on the spot meant the Traditional tag behind it was never read. Only
  // a later tag in the same language may supersede the guess; a different
  // language must not, or de-AT,fr-FR would answer fr-FR.
  for (i = 0; i < offered.length; i++) {
    tag = offered[i] || '';
    parts = tag.toLowerCase().split('-');
    language = parts[0];

    precise = '';
    for (j = 0; j < locales.length; j++) {
      if (locales[j] === tag) { precise = locales[j]; break; }
    }
    if (!precise && parts.length > 1) {
      form = forms[parts[0] + '-' + parts[1]];
      if (form) { precise = form; }
    }
    if (precise) {
      if (!provisional || provisional.indexOf(language + '-') === 0) { target = precise; break; }
      continue;
    }

    if (!provisional) {
      // Case-sensitive, unlike the table lookup and like detectLocale: locales
      // holds zh-CN, so ZH-QQ matches no prefix and falls through.
      prefix = tag.split('-')[0] + '-';
      for (j = 0; j < locales.length; j++) {
        if (locales[j].indexOf(prefix) === 0) { provisional = locales[j]; break; }
      }
    }
  }

  // replace(), not assign(): the apex must not enter session history, or Back
  // from a locale home returns here and is bounced straight forward again.
  w.location.replace('/' + (target || provisional || fallback));
})(window);`;
