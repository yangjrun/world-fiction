import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { isLocale, locales, type Locale } from '@/i18n/config';
// Imported from the pure module rather than `@/lib/specs`, which re-exports it:
// `specs.ts` imports `astro:content`, and plain vitest cannot resolve that.
import { matchesLocale } from '@/lib/specs-locale';

// Astro's glob loader slugifies EVERY path segment of a collection id, so
// `src/content/specs/en-US/us-passport.md` arrives as `en-us/us-passport` —
// lowercased. The obvious filter, `id.split('/')[0] === locale`, is therefore
// false for every locale, and it fails silently: the collection query returns
// nothing, every page vanishes, and the build still exits 0.
//
// These tests pin the contract that survives that: a lowercased directory
// segment must match its mixed-case locale tag, and nothing else may.

/** How the glob loader renders a locale directory into an entry id segment. */
function slugifyLocaleDir(locale: Locale): string {
  return locale.toLowerCase();
}

describe('matchesLocale', () => {
  it('pins the loader transform as data, not as its own expression', () => {
    // slugifyLocaleDir is the same expression the implementation uses, so on its
    // own it proves the two agree, not that the predicate inverts
    // github-slugger. State the real id as a literal instead: this is what
    // src/content/specs/en-US/us-passport.md arrives as, confirmed against the
    // installed github-slugger in the Task 5 review.
    expect(slugifyLocaleDir('en-US')).toBe('en-us');
    expect(`${slugifyLocaleDir('en-US')}/us-passport`).toBe('en-us/us-passport');
    expect(matchesLocale('en-us/us-passport', 'en-US')).toBe(true);
  });

  it('matches the slugified id of every configured locale', () => {
    for (const locale of locales) {
      const id = `${slugifyLocaleDir(locale)}/us-passport`;
      expect(matchesLocale(id, locale), `${id} should match ${locale}`).toBe(true);
    }
  });

  it('still matches an id whose locale segment was not slugified', () => {
    // Defensive: if a `generateId` is ever added to the glob loader, or Astro
    // stops lowercasing segments, the filter must keep working rather than
    // silently emptying every locale again.
    for (const locale of locales) {
      expect(matchesLocale(`${locale}/us-passport`, locale)).toBe(true);
    }
  });

  it('would be broken by the strict-equality comparison it replaces', () => {
    for (const locale of locales) {
      const id = `${slugifyLocaleDir(locale)}/us-passport`;
      // The defect, reproduced: the brief's `id.split('/')[0] === locale`.
      //
      // Guarded, because the slugified segment differs from the tag only while
      // the tag carries an uppercase subtag. Add an all-lowercase locale — `en`,
      // `pt`, `ja` — and an unguarded assertion here would go red against a
      // matchesLocale that is entirely correct, which is a test asserting that a
      // bug is still present.
      if (locale !== locale.toLowerCase()) {
        expect(id.split('/')[0]).not.toBe(locale);
      }
      expect(matchesLocale(id, locale)).toBe(true);
    }
  });

  it('never matches an id belonging to a different locale', () => {
    for (const owner of locales) {
      const id = `${slugifyLocaleDir(owner)}/us-passport`;
      for (const other of locales) {
        if (other === owner) continue;
        expect(matchesLocale(id, other), `${id} must not match ${other}`).toBe(false);
      }
    }
  });

  it('separates locales that share a language subtag', () => {
    // The pair a prefix or startsWith comparison would confuse.
    expect(matchesLocale('zh-cn/us-passport', 'zh-TW')).toBe(false);
    expect(matchesLocale('zh-tw/us-passport', 'zh-CN')).toBe(false);
    expect(matchesLocale('zh-cn/us-passport', 'zh-CN')).toBe(true);
    expect(matchesLocale('zh-tw/us-passport', 'zh-TW')).toBe(true);
  });

  it('never matches a neighbouring locale of ja-JP', () => {
    expect(matchesLocale('ja-jp/us-passport', 'it-IT')).toBe(false);
    expect(matchesLocale('ja-jp/us-passport', 'ko-KR')).toBe(false);
    expect(matchesLocale('it-it/us-passport', 'ja-JP')).toBe(false);
    expect(matchesLocale('ko-kr/us-passport', 'ja-JP')).toBe(false);
  });

  it('rejects near-miss locale segments', () => {
    expect(matchesLocale('en/us-passport', 'en-US')).toBe(false);
    expect(matchesLocale('en-usx/us-passport', 'en-US')).toBe(false);
    expect(matchesLocale('en-u/us-passport', 'en-US')).toBe(false);
    expect(matchesLocale('xen-us/us-passport', 'en-US')).toBe(false);
    expect(matchesLocale('en_us/us-passport', 'en-US')).toBe(false);
  });

  it('rejects an id with no locale segment at all', () => {
    expect(matchesLocale('us-passport', 'en-US')).toBe(false);
    expect(matchesLocale('schengen-visa', 'de-DE')).toBe(false);
  });

  it('only considers the first segment', () => {
    expect(matchesLocale('us/en-us/passport', 'en-US')).toBe(false);
    expect(matchesLocale('en-us/eu/schengen-visa', 'en-US')).toBe(true);
  });

  it('does not throw on ids with no slash, or on an empty id', () => {
    expect(() => matchesLocale('us-passport', 'en-US')).not.toThrow();
    expect(() => matchesLocale('', 'en-US')).not.toThrow();
    expect(matchesLocale('', 'en-US')).toBe(false);
  });

  it('does not match an id that is only a locale segment', () => {
    // A stray `src/content/specs/en-US.md` sits outside every locale directory.
    expect(matchesLocale('en-us', 'en-US')).toBe(false);
    expect(matchesLocale('de-de', 'de-DE')).toBe(false);
  });
});

describe('src/content/specs layout', () => {
  it('contains nothing but directories named after a configured locale', () => {
    // matchesLocale drops an id whose first segment is not a configured locale,
    // and an empty collection query is not an error — so a stray `en-GB/`,
    // `en_US/`, or a file left at the top level, would disappear from the build
    // at exit 0. That is the same silent-drop class as the bug this module was
    // written to fix, and ten more locale directories are about to arrive,
    // hand-edited. Read the tree rather than trusting the convention.
    const specsDir = fileURLToPath(new URL('../../src/content/specs', import.meta.url));
    const entries = readdirSync(specsDir, { withFileTypes: true });

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.isDirectory(), `${entry.name} must be a directory, not a file`).toBe(true);
      expect(isLocale(entry.name), `${entry.name} is not a configured locale`).toBe(true);
    }
  });
});
