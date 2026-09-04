import { describe, it, expect } from 'vitest';

import { locales } from '@/i18n/config';
import { detectLocale } from '@/i18n/detect-locale';

describe('Language detection', () => {
  it('should return default locale when Accept-Language is null', () => {
    expect(detectLocale(null)).toBe('en-US');
  });

  it('should match exact locale', () => {
    expect(detectLocale('zh-CN')).toBe('zh-CN');
    expect(detectLocale('ja-JP')).toBe('ja-JP');
  });

  it('should match language prefix', () => {
    expect(detectLocale('zh')).toBe('zh-CN'); // First match
    expect(detectLocale('ja')).toBe('ja-JP');
    expect(detectLocale('de')).toBe('de-DE');
  });

  it('should handle quality values', () => {
    expect(detectLocale('fr-FR;q=0.9,en-US;q=0.8')).toBe('fr-FR');
    expect(detectLocale('en-US;q=0.5,zh-CN;q=0.9')).toBe('zh-CN');
  });

  it('should handle multiple languages and pick best match', () => {
    expect(detectLocale('en-GB,en;q=0.9')).toBe('en-US');
    expect(detectLocale('pt-BR,pt;q=0.9')).toBe('pt-PT');
  });

  it('should return default for unsupported language', () => {
    expect(detectLocale('ru-RU')).toBe('en-US');
    expect(detectLocale('ar-SA')).toBe('en-US');
  });

  it('should handle complex Accept-Language headers', () => {
    const complex = 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5';
    expect(detectLocale(complex)).toBe('fr-FR');
  });
});

// The site publishes Chinese twice, once per written form, so a tag that names
// its script or its region has already said which one it wants. Reducing every
// tag to its language subtag discarded that: every Traditional tag except the
// literal `zh-TW` resolved to Simplified — including `zh-Hant`, which names the
// script outright, and `zh-Hant-HK`, which is what Safari reports for a Hong
// Kong reader.
describe('Chinese written forms', () => {
  it('sends a Hant script subtag to Traditional', () => {
    expect(detectLocale('zh-Hant')).toBe('zh-TW');
    expect(detectLocale('zh-Hant-HK')).toBe('zh-TW');
    expect(detectLocale('zh-Hant-TW')).toBe('zh-TW');
  });

  it('sends a Traditional region to Traditional, whatever its case', () => {
    expect(detectLocale('zh-HK')).toBe('zh-TW');
    expect(detectLocale('zh-MO')).toBe('zh-TW');
    expect(detectLocale('zh-TW')).toBe('zh-TW');
    expect(detectLocale('zh-tw')).toBe('zh-TW');
  });

  it('sends a Hans script subtag or a Simplified region to Simplified', () => {
    expect(detectLocale('zh-Hans')).toBe('zh-CN');
    expect(detectLocale('zh-Hans-CN')).toBe('zh-CN');
    expect(detectLocale('zh-SG')).toBe('zh-CN');
    expect(detectLocale('zh-cn')).toBe('zh-CN');
  });

  it('leaves bare zh on Simplified', () => {
    // No script and no region: nothing has been said about the written form, so
    // the language-prefix step takes the first configured zh-* as it always did.
    expect(detectLocale('zh')).toBe('zh-CN');
    expect(detectLocale('zh;q=0.9,en;q=0.8')).toBe('zh-CN');
  });

  it('settles a written form before a lower-priority exact match', () => {
    // The Safari-in-Hong-Kong header. Leaving written forms to a pass after the
    // exact one would hand this reader the English sitting at position four.
    expect(detectLocale('zh-Hant-HK,zh-HK;q=0.9,zh;q=0.8,en-US;q=0.7')).toBe('zh-TW');
    expect(detectLocale('zh-HK,zh-CN;q=0.9')).toBe('zh-TW');
  });

  it('does not let a Chinese tag outrank a non-Chinese first preference', () => {
    // The mirror image of the bug the table fixes, and the reason the matcher
    // cascades per tag rather than running the table across the whole list: as a
    // second whole-list pass it sent every one of these headers to Chinese. The
    // earlier name for this test, "leaves the other ten locales alone", checked
    // only isolated tags — the shapes that never changed — so it read as a
    // guarantee it was not making. These are mixed headers, which is where the
    // inversion actually happened.
    expect(detectLocale('en-HK,en;q=0.9,zh-HK;q=0.8')).toBe('en-US');
    expect(detectLocale('ja,zh-Hant')).toBe('ja-JP');
    expect(detectLocale('pt-MO,zh-MO')).toBe('pt-PT');
    expect(detectLocale('de-AT,zh-SG')).toBe('de-DE');
    expect(detectLocale('fr-CA,zh-tw')).toBe('fr-FR');
  });

  it('reaches the table only through a zh tag', () => {
    // Keyed on two subtags, so sharing a region with a Traditional entry cannot
    // pull a non-Chinese tag into the table.
    expect(detectLocale('en-HK')).toBe('en-US');
    expect(detectLocale('pt-MO')).toBe('pt-PT');
    expect(detectLocale('en-TW')).toBe('en-US');
  });

  it('takes zh-CN for an unmarked zh tag, because it is the first zh locale', () => {
    // Also the reason the table needs Traditional rows and not Simplified ones:
    // the prefix step lands on the first configured zh-*. If that order ever
    // changes, this fails first and the table has to be revisited.
    expect(locales.filter((l) => l.startsWith('zh-'))[0]).toBe('zh-CN');
    expect(detectLocale('zh')).toBe('zh-CN');
    expect(detectLocale('zh-QQ')).toBe('zh-CN');
  });

  it('matches a zh tag whatever its case, which is what the Simplified rows earn', () => {
    // The lookup lower-cases the tag, so the table is what makes the zh family
    // case-insensitive. Drop the three Simplified rows and ZH-CN, ZH-SG and
    // ZH-HANS match nothing at all — `locales` holds `zh-CN`, and the prefix
    // step compares `ZH-` case-sensitively — so they fall back to English while
    // ZH-TW still resolves.
    expect(detectLocale('ZH-TW')).toBe('zh-TW');
    expect(detectLocale('ZH-CN')).toBe('zh-CN');
    expect(detectLocale('ZH-SG')).toBe('zh-CN');
    expect(detectLocale('ZH-HANS')).toBe('zh-CN');
    // The property stops where the table's reach does: a bare ZH has no second
    // subtag, so it never gets there and falls back like the other ten locales,
    // which are case-sensitive throughout. Browsers emit canonical case, so the
    // asymmetry is documented rather than fixed.
    expect(detectLocale('ZH')).toBe('en-US');
    expect(detectLocale('JA-JP')).toBe('en-US');
  });

  it('lets an explicit Traditional tag behind a bare zh still win', () => {
    // Chrome and Edge both list a plain "Chinese" next to "Chinese (Traditional)",
    // so a reader who ranks the first above the second sends exactly this. While a
    // language-prefix hit was returned on the spot, bare zh resolved to zh-CN and
    // consumed the list before the Traditional tag behind it was read. A
    // prefix-only hit is a guess about the written form, so it is held and a later
    // tag in the same language may supersede it.
    expect(detectLocale('zh,zh-TW')).toBe('zh-TW');
    expect(detectLocale('zh,zh-Hant-HK')).toBe('zh-TW');
    expect(detectLocale('zh,zh-HK,en-US')).toBe('zh-TW');
    expect(detectLocale('zh;q=0.9,zh-TW;q=0.8,en-US;q=0.7')).toBe('zh-TW');
    // An unrecognised region is the same kind of guess.
    expect(detectLocale('zh-QQ,zh-TW')).toBe('zh-TW');
  });

  it('lets only the same language supersede a held prefix match', () => {
    // The other half of that rule, and the reason de-AT,fr-FR still answers
    // de-DE: a precise tag in a *different* language must not override a first
    // preference the reader stated, however imprecisely.
    expect(detectLocale('zh,en-US')).toBe('zh-CN');
    expect(detectLocale('zh-QQ,ja-JP')).toBe('zh-CN');
    expect(detectLocale('en-HK,zh-TW')).toBe('en-US');
  });

  it('keeps a Chinese first preference ahead of a lower-ranked exact match', () => {
    // The cascade rather than the table: without it the exact en-US at position
    // two beats the reader's own first choice.
    expect(detectLocale('zh-SG,en-US')).toBe('zh-CN');
    expect(detectLocale('zh-Hans,en-US')).toBe('zh-CN');
    expect(detectLocale('zh-HK,en-US')).toBe('zh-TW');
  });
});

describe('Preference order', () => {
  it('takes the visitor first choice when two tags match exactly', () => {
    // Iterating the site's locale list on the outside instead of the visitor's
    // preferences answers both of these with the alphabetically earlier locale,
    // en-US and de-DE, and no single-match test in this file would notice.
    expect(detectLocale('zh-TW,en-US')).toBe('zh-TW');
    expect(detectLocale('ja-JP,de-DE')).toBe('ja-JP');
  });

  it('prefers the top tag language over an exact match further down', () => {
    // A retired expectation, deliberately: this asserted fr-FR until the matcher
    // became a per-tag cascade. de-AT is the reader's first choice and the site
    // publishes German, so answering with the exact fr-FR sitting second
    // overrode a preference the reader had stated. RFC 4647 lookup walks the
    // list in order and takes the best available match for each tag, which is
    // the better reading and now the implemented one.
    expect(detectLocale('de-AT,fr-FR')).toBe('de-DE');
    expect(detectLocale('en-GB,ja-JP')).toBe('en-US');
  });
});
