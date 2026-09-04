import { describe, expect, it } from 'vitest';

import { apexRedirectScript } from '@/i18n/apex-redirect';
import { defaultLocale, locales } from '@/i18n/config';
import { detectLocale, writtenForms } from '@/i18n/detect-locale';

// `src/pages/index.astro` ships this script inline, so nothing bundles or
// type-checks it and no browser is involved in running it. These tests execute
// the exact source string against a fake `window`, which is what makes the
// duplication deliberate rather than accidental: the apex resolves a language
// from `navigator.languages` and `detectLocale` resolves one from an
// `Accept-Language` header, and the block below asserts, tag list by tag list,
// that the two agree.

interface FakeNavigator {
  readonly languages?: readonly string[] | undefined;
  readonly language?: string | undefined;
}

interface Navigation {
  readonly method: 'replace' | 'assign' | 'href';
  readonly url: string;
}

/** Run the shipped source and report every navigation it attempted. */
function navigate(navigator: FakeNavigator | undefined): readonly Navigation[] {
  const attempts: Navigation[] = [];
  const location = {
    replace(url: string) {
      attempts.push({ method: 'replace', url });
    },
    assign(url: string) {
      attempts.push({ method: 'assign', url });
    },
    set href(url: string) {
      attempts.push({ method: 'href', url });
    },
  };

  const run = new Function('window', apexRedirectScript) as (win: unknown) => void;
  run({ navigator, location });

  return attempts;
}

/** The single URL the script redirected to. */
function target(navigator: FakeNavigator): string {
  const attempts = navigate(navigator);
  expect(attempts).toHaveLength(1);
  const [only] = attempts;
  if (only === undefined) throw new Error('the apex script navigated nowhere');
  return only.url;
}

/**
 * The header form of the same preference list. `navigator.languages` is already
 * ordered by preference and `detectLocale` sorts by `q` with a stable sort, so
 * omitting `q` leaves the order untouched.
 */
function asHeader(tags: readonly string[]): string {
  return tags.join(',');
}

const TAG_LISTS: readonly (readonly string[])[] = [
  // Every configured locale, offered exactly.
  ...locales.map((locale) => [locale]),
  // Language-only tags, and regional variants the site does not publish.
  ['zh'],
  ['pt-BR', 'pt'],
  ['en-GB', 'en'],
  ['es-MX', 'es'],
  ['nl-BE'],
  ['ko'],
  // Chinese written forms: the script or the region decides, not the bare `zh`.
  ['zh-Hant'],
  ['zh-Hant-HK'],
  ['zh-Hant-TW'],
  ['zh-HK'],
  ['zh-MO'],
  ['zh-tw'],
  ['zh-Hans'],
  ['zh-SG'],
  ['zh-Hant-HK', 'zh-HK', 'zh', 'en-US'],
  // Two or more exact matches: the visitor's order decides, not the site's.
  ['zh-TW', 'en-US'],
  ['ja-JP', 'de-DE'],
  // A prefix match on the top tag beats an exact match further down: the
  // matcher walks the reader's list rather than the site's.
  ['de-AT', 'fr-FR'],
  ['en-GB', 'ja-JP'],
  // A Chinese tag must not outrank a non-Chinese first preference — the mirror
  // image of the fault the written-form table fixes.
  ['en-HK', 'en', 'zh-HK'],
  ['ja', 'zh-Hant'],
  ['pt-MO', 'zh-MO'],
  ['de-AT', 'zh-SG'],
  ['fr-CA', 'zh-tw'],
  // A Chinese first preference must not lose to a lower-ranked exact match.
  ['zh-SG', 'en-US'],
  ['zh-Hans', 'en-US'],
  ['zh-HK', 'en-US'],
  // A precise tag behind a bare zh must still win: browsers offer plain
  // "Chinese" as a selectable language, so this is a shape readers send.
  ['zh', 'zh-TW'],
  ['zh', 'zh-Hant-HK'],
  ['zh', 'zh-HK', 'en-US'],
  ['zh-QQ', 'zh-TW'],
  // ...but only the same language may supersede a held prefix match.
  ['zh', 'en-US'],
  ['en-HK', 'zh-TW'],
  // Case variants: the table lower-cases its lookup, the other steps do not.
  ['ZH-TW'],
  ['ZH-CN'],
  ['ZH-SG'],
  ['ZH-HANS'],
  ['JA-JP'],
  ['ZH'],
  ['zh-QQ'],
  // Nothing configured matches.
  ['ru-RU'],
  ['ar-SA', 'fa-IR'],
  // The long real-world shape.
  ['fr-CH', 'fr', 'en', 'de'],
];

describe('apex redirect script', () => {
  it('replaces the apex in history instead of pushing onto it', () => {
    // Back from a locale home would otherwise land here and be bounced straight
    // forward again, trapping the reader.
    expect(navigate({ languages: ['ja-JP'] })).toEqual([{ method: 'replace', url: '/ja-JP' }]);
  });

  it('sends every configured locale to its own home, extension-free', () => {
    for (const locale of locales) {
      const url = target({ languages: [locale] });
      expect(url).toBe(`/${locale}`);
      expect(url).not.toMatch(/\.html$/);
      expect(url).not.toMatch(/\/$/);
      expect(url.split('/')).toHaveLength(2);
    }
  });

  it('prefers an exact locale over a language-only match', () => {
    // Within a single tag the exact match is tried before the language prefix: a
    // Taiwanese reader must not be handed Simplified Chinese. (The whole-list
    // passes the earlier wording referred to are gone — the matcher cascades per
    // tag, and a prefix-only hit is held rather than returned.)
    expect(target({ languages: ['zh-TW'] })).toBe('/zh-TW');
    expect(target({ languages: ['zh'] })).toBe('/zh-CN');
  });

  it('prefers the top tag language over an exact match further down', () => {
    // A retired expectation, deliberately: this line asserted /fr-FR until the
    // matcher became a per-tag cascade. de-AT is the visitor's first choice and
    // the site publishes German, so answering with the exact fr-FR sitting
    // second overrode a preference the visitor had stated. RFC 4647 lookup walks
    // the list in order and takes the best available match for each tag.
    expect(target({ languages: ['de-AT', 'fr-FR'] })).toBe('/de-DE');
    expect(target({ languages: ['en-GB', 'ja-JP'] })).toBe('/en-US');
  });

  it('falls back to navigator.language when navigator.languages is unusable', () => {
    expect(target({ languages: undefined, language: 'ja-JP' })).toBe('/ja-JP');
    expect(target({ languages: [], language: 'ko-KR' })).toBe('/ko-KR');
  });

  it('falls back to the default locale when the browser offers nothing usable', () => {
    expect(target({})).toBe(`/${defaultLocale}`);
    expect(target({ languages: ['ru-RU'] })).toBe(`/${defaultLocale}`);
    expect(navigate(undefined)).toEqual([{ method: 'replace', url: `/${defaultLocale}` }]);
  });

  it('carries the configured locale list and nothing else', () => {
    // The list is injected from src/i18n/config.ts; this catches a hand-edit.
    // Canonical `ll-RR` shape only: the written-form table's keys are lower-case
    // (`"zh-tw"`) or carry a four-letter script (`"zh-hant"`), so this picks out
    // the locale codes and leaves the table's keys alone.
    const quoted = apexRedirectScript.match(/"[a-z]{2}-[A-Z]{2}"/g) ?? [];
    const found = [...new Set(quoted.map((q) => q.slice(1, -1)))];
    expect(found.sort()).toEqual([...locales].sort());
  });

  it('carries the written-form table as injected data, not a hand copy', () => {
    const json = apexRedirectScript.match(/var forms = ({.*?});/)?.[1];
    if (json === undefined) throw new Error('the script carries no written-form table');
    expect(JSON.parse(json)).toEqual(writtenForms);
  });

  it('sends every Traditional Chinese tag to Traditional, not just zh-TW', () => {
    // Absolute values, not parity: reduce these to `zh` on *both* sides and the
    // parity block below stays green while every Traditional reader outside
    // Taiwan is handed Simplified.
    for (const tag of ['zh-Hant', 'zh-Hant-HK', 'zh-Hant-TW', 'zh-HK', 'zh-MO', 'zh-TW', 'zh-tw']) {
      expect(target({ languages: [tag] })).toBe('/zh-TW');
    }
    for (const tag of ['zh-Hans', 'zh-Hans-CN', 'zh-CN', 'zh-SG', 'zh']) {
      expect(target({ languages: [tag] })).toBe('/zh-CN');
    }
  });

  it('honours the visitor order when two tags match exactly', () => {
    // The nested loops this shape invites can be written either way round, and
    // iterating the site's locale list on the outside passes every single-tag
    // case in this file: it answers these with the alphabetically earlier locale.
    expect(target({ languages: ['zh-TW', 'en-US'] })).toBe('/zh-TW');
    expect(target({ languages: ['ja-JP', 'de-DE'] })).toBe('/ja-JP');
    expect(target({ languages: ['zh-Hant-HK', 'en-US'] })).toBe('/zh-TW');
  });

  it('does not let a Chinese tag outrank a non-Chinese first preference', () => {
    // Absolute values for the five headers the earlier placement inverted. Parity
    // alone would not have caught it: both matchers shared the placement.
    expect(target({ languages: ['en-HK', 'en', 'zh-HK'] })).toBe('/en-US');
    expect(target({ languages: ['ja', 'zh-Hant'] })).toBe('/ja-JP');
    expect(target({ languages: ['pt-MO', 'zh-MO'] })).toBe('/pt-PT');
    expect(target({ languages: ['de-AT', 'zh-SG'] })).toBe('/de-DE');
    expect(target({ languages: ['fr-CA', 'zh-tw'] })).toBe('/fr-FR');
  });

  it('keeps a Chinese first preference ahead of a lower-ranked exact match', () => {
    // The other direction, and the reason the cascade runs per tag: the exact
    // en-US at position two must not beat the visitor's own first choice.
    expect(target({ languages: ['zh-SG', 'en-US'] })).toBe('/zh-CN');
    expect(target({ languages: ['zh-Hans', 'en-US'] })).toBe('/zh-CN');
    expect(target({ languages: ['zh-HK', 'en-US'] })).toBe('/zh-TW');
    expect(target({ languages: ['zh-Hant-HK', 'zh-HK', 'zh', 'en-US'] })).toBe('/zh-TW');
  });

  it('resolves a zh tag whatever its case, and only a zh tag', () => {
    // The written-form lookup lower-cases the tag, so the zh family is
    // case-insensitive and the other ten are not. Browsers emit canonical case;
    // this pins the asymmetry rather than endorsing it.
    expect(target({ languages: ['ZH-TW'] })).toBe('/zh-TW');
    expect(target({ languages: ['ZH-CN'] })).toBe('/zh-CN');
    expect(target({ languages: ['ZH-SG'] })).toBe('/zh-CN');
    expect(target({ languages: ['ZH-HANS'] })).toBe('/zh-CN');
    // And it stops where the table's reach does: a bare ZH has no second subtag,
    // so it never reaches the table and falls back like the other ten.
    expect(target({ languages: ['ZH'] })).toBe('/en-US');
    expect(target({ languages: ['JA-JP'] })).toBe('/en-US');
  });

  it('lets an explicit Traditional tag behind a bare zh still win', () => {
    // Chrome and Edge list a plain "Chinese" next to "Chinese (Traditional)", so a
    // visitor who ranks the first above the second sends exactly this. Returning
    // the bare zh prefix hit on the spot answered /zh-CN and never read the
    // Traditional tag behind it.
    expect(target({ languages: ['zh', 'zh-TW'] })).toBe('/zh-TW');
    expect(target({ languages: ['zh', 'zh-Hant-HK'] })).toBe('/zh-TW');
    expect(target({ languages: ['zh', 'zh-HK', 'en-US'] })).toBe('/zh-TW');
    expect(target({ languages: ['zh-QQ', 'zh-TW'] })).toBe('/zh-TW');
  });

  it('lets only the same language supersede a held prefix match', () => {
    // Which is why de-AT,fr-FR still answers /de-DE: a precise tag in another
    // language must not override the visitor's own first preference.
    expect(target({ languages: ['zh', 'en-US'] })).toBe('/zh-CN');
    expect(target({ languages: ['en-HK', 'zh-TW'] })).toBe('/en-US');
    expect(target({ languages: ['de-AT', 'fr-FR'] })).toBe('/de-DE');
  });

  describe('agrees with detectLocale', () => {
    for (const tags of TAG_LISTS) {
      it(`resolves ${asHeader(tags)} the same way`, () => {
        expect(target({ languages: tags })).toBe(`/${detectLocale(asHeader(tags))}`);
      });
    }
  });
});
