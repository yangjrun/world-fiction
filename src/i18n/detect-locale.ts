import { locales, defaultLocale, isLocale } from './config';
import type { Locale } from './config';

/**
 * Locales a tag chooses through its script or region subtag rather than through
 * its language subtag.
 *
 * The site publishes Chinese twice, once per written form, so reducing a tag to
 * `zh` throws away the only part that says which one the reader wants: every
 * Traditional tag except the literal `zh-TW` — `zh-Hant`, `zh-Hant-HK` (what
 * Safari reports for a Hong Kong reader), `zh-Hant-TW`, `zh-HK`, `zh-MO`, and
 * `zh-TW` written in lower case — would otherwise land on Simplified, because
 * `zh-CN` is the first configured `zh-*` and so the one the language-prefix step
 * picks. Reordering `locales` is not the fix: promoting `zh-TW` merely moves the
 * harm onto bare `zh` and the `zh-Hans-*` tags, a larger population.
 *
 * Keyed by the first two subtags, lower-cased, so one entry covers a tag of any
 * length: `zh-hant` answers `zh-Hant`, `zh-Hant-HK` and `zh-Hant-TW` alike.
 *
 * The Simplified rows do not redirect anything — `zh-CN` is where the prefix step
 * lands anyway — but they are not decoration either. Because the lookup
 * lower-cases the tag, they are what makes the whole `zh` family
 * case-insensitive: without them `ZH-CN` and `ZH-HANS` match nothing at all
 * (`locales` holds `zh-CN`, and the prefix step compares `ZH-` case-sensitively)
 * and fall through to `defaultLocale`, while `ZH-TW` still resolves. Listing both
 * halves keeps that property whole and states the mapping as data.
 *
 * That leaves one asymmetry worth knowing: the `zh` tags are effectively
 * case-insensitive while the other ten locales are not — `ZH-TW` resolves to
 * `zh-TW`, `JA-JP` resolves to nothing and falls back. Browsers emit canonical
 * case, so this is a property to know rather than a bug to fix; a general
 * case-fold would belong in `isLocale` and the prefix step, not here.
 *
 * Only `zh` needs entries today. A language published under a single locale
 * resolves through the language-prefix step exactly as it always did.
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

  // One cascade per tag, in the reader's order of preference: an exact locale,
  // then the written form the tag names, then the language on its own. The first
  // tag that resolves at all wins.
  //
  // Per tag, not a pass per rule, because either pass order inverts somebody's
  // preferences. Running every exact match first sends
  // `zh-Hant-HK,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7` — Safari in Hong Kong — to the
  // English sitting fourth. Running every written form first sends
  // `en-HK,en;q=0.9,zh-HK;q=0.8` to Traditional Chinese, the same fault mirrored.
  // Walking the reader's list once and taking the best available match for each
  // tag is what RFC 4647 lookup describes, and it answers both correctly.
  for (const { code } of languages) {
    if (isLocale(code)) return code;

    const form = writtenForm(code);
    if (form !== undefined) return form;

    const [language = ''] = code.split('-');
    const prefixed = locales.find(l => l.startsWith(language + '-'));
    if (prefixed !== undefined) return prefixed;
  }

  return defaultLocale;
}
