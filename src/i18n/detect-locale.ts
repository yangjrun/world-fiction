import { locales, defaultLocale, isLocale } from './config';
import type { Locale } from './config';

/**
 * Locales a tag chooses through its script or region subtag rather than through
 * its language subtag.
 *
 * The site publishes Chinese twice, once per written form, so reducing a tag to
 * `zh` throws away the only part that says which one the reader wants: every
 * Traditional tag except the literal `zh-TW` — `zh-Hant`, `zh-Hant-HK` (what
 * Safari reports for a Hong Kong reader), `zh-HK`, `zh-MO`, and `zh-TW` written
 * in lower case — would otherwise land on Simplified.
 *
 * Keyed by the first two subtags, lower-cased, so one entry covers a tag of any
 * length: `zh-hant` answers `zh-Hant`, `zh-Hant-HK` and `zh-Hant-TW` alike.
 * Reordering `locales` would not fix this — promoting `zh-TW` above `zh-CN`
 * merely moves the harm onto bare `zh` and the `zh-Hans-*` tags, a larger
 * population — and a table keeps the mapping reviewable as data.
 *
 * Only `zh` needs entries today. A language published under one locale resolves
 * through the language-prefix pass exactly as before.
 */
export const writtenForms: Readonly<Record<string, Locale>> = {
  'zh-hans': 'zh-CN',
  'zh-cn': 'zh-CN',
  'zh-sg': 'zh-CN',
  'zh-hant': 'zh-TW',
  'zh-tw': 'zh-TW',
  'zh-hk': 'zh-TW',
  'zh-mo': 'zh-TW',
};

/** The locale a tag names outright through its script or region, if any. */
function writtenForm(code: string): Locale | undefined {
  const [language = '', second] = code.toLowerCase().split('-');
  if (second === undefined) return undefined;
  return writtenForms[`${language}-${second}`];
}

export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code = '', q = '1'] = lang.trim().split(';q=');
      return { code: code.trim(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // An exact locale, or a written form the tag names outright — both are the
  // reader stating which locale they want, so both are settled in this pass, in
  // the reader's own order of preference. Deferring the written form to a later
  // pass would hand `zh-Hant-HK,en-US;q=0.8` the English at position two.
  for (const { code } of languages) {
    if (isLocale(code)) return code;
    const form = writtenForm(code);
    if (form !== undefined) return form;
  }

  // Try language-only match (e.g., zh -> zh-CN)
  for (const { code } of languages) {
    const [lang = ''] = code.split('-');
    const match = locales.find(l => l.startsWith(lang + '-'));
    if (match) return match;
  }

  return defaultLocale;
}
