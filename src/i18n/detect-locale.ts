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
 * lower-cases the tag, they are what makes a two-subtag `zh` tag
 * case-insensitive: without them `ZH-CN` and `ZH-HANS` match nothing at all
 * (`locales` holds `zh-CN`, and the prefix step compares `ZH-` case-sensitively)
 * and fall through to `defaultLocale`, while `ZH-TW` still resolves. Listing both
 * halves keeps that property whole and states the mapping as data.
 *
 * The property stops at the table's own reach, which is worth being exact about:
 * a bare `ZH` has no second subtag, never reaches the table, and answers
 * `defaultLocale`. So two-subtag `zh` tags are case-insensitive; a bare one is
 * not, and neither are the other ten locales — `ZH-TW` resolves to `zh-TW`,
 * `JA-JP` and `ZH` fall back. Browsers emit canonical case, so this is a property
 * to know rather than a bug to fix; a general case-fold would belong in
 * `isLocale` and the prefix step, not here.
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

  // Walk the reader's list once, in their order of preference. A tag that names a
  // locale precisely — an exact match, or a written form out of the table above —
  // settles the question where it stands. A tag that only shares a language with
  // something published is a guess, so it is held rather than returned.
  //
  // Per tag, because either whole-list pass order inverts somebody's preferences:
  // every exact match first sends `zh-Hant-HK,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7` —
  // Safari in Hong Kong — to the English sitting fourth, and every written form
  // first sends `en-HK,en;q=0.9,zh-HK;q=0.8` to Traditional Chinese.
  //
  // Held, not returned, because returning the guess immediately consumed the rest
  // of the list: Chrome and Edge both offer a plain "Chinese" alongside "Chinese
  // (Traditional)", so `zh,zh-TW;q=0.9` is a shape readers really send, and `zh`
  // resolving to `zh-CN` on the spot meant the explicit Traditional tag behind it
  // was never read. Only a later tag in the *same* language may supersede the
  // guess; a different language must not, or `de-AT,fr-FR` would answer `fr-FR`
  // and override a first preference the reader stated plainly.
  let provisional: Locale | undefined;

  for (const { code } of languages) {
    const [language = ''] = code.toLowerCase().split('-');

    const precise = isLocale(code) ? code : writtenForm(code);
    if (precise !== undefined) {
      if (provisional === undefined || provisional.startsWith(`${language}-`)) return precise;
      continue;
    }

    if (provisional === undefined) {
      // Case-sensitive, unlike the table lookup: `locales` holds `zh-CN`, so a
      // `ZH-QQ` matches no prefix and falls through to the default.
      const [rawLanguage = ''] = code.split('-');
      provisional = locales.find(l => l.startsWith(`${rawLanguage}-`));
    }
  }

  return provisional ?? defaultLocale;
}
