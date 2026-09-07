import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { isLocale, locales, type Locale } from '@/i18n/config';
// Imported from the pure module rather than `@/lib/specs`, which re-exports it:
// `specs.ts` imports `astro:content`, and plain vitest cannot resolve that.
import {
  countDistinctDocuments,
  isPublished,
  localesWithDocument,
  matchesLocale,
  type LocalePublications,
} from '@/lib/specs-locale';

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
    // written to fix, and all eleven locale directories are now hand-edited
    // territory. Read the tree rather than trusting the convention.
    const specsDir = fileURLToPath(new URL('../../src/content/specs', import.meta.url));
    const entries = readdirSync(specsDir, { withFileTypes: true });

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.isDirectory(), `${entry.name} must be a directory, not a file`).toBe(true);
      expect(isLocale(entry.name), `${entry.name} is not a configured locale`).toBe(true);
    }
  });

  it('has a directory for every configured locale', () => {
    // The inverse of the check above, and now the half that bites. A locale with
    // no directory at all is not a stray entry that scan can see: matchesLocale
    // simply matches nothing for it, an empty collection query is not an error,
    // and that locale's home page ships with no documents on it at exit 0.
    // Forgetting one while renaming a directory is an ordinary mistake; catching
    // it by reading eleven built pages is not.
    const specsDir = fileURLToPath(new URL('../../src/content/specs', import.meta.url));
    const directories = readdirSync(specsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    for (const locale of locales) {
      expect(directories, `${locale} has no directory under src/content/specs`).toContain(locale);
    }
  });
});

// The about page says "there are currently N verified specifications on the site".
// N used to be this locale's own count, which is 0 in the ten locales that have no
// verified content — a false sentence, in the section that exists to say the
// numbers here are checked. countDistinctDocuments answers the question the
// sentence asks instead, without counting one document once per language.
describe('countDistinctDocuments', () => {
  it('counts a document once however many locales publish it', () => {
    const passport = { country: 'us', document: 'passport' };
    expect(countDistinctDocuments([passport, passport, passport])).toBe(1);
  });

  it('counts different documents separately', () => {
    expect(
      countDistinctDocuments([
        { country: 'us', document: 'passport' },
        { country: 'us', document: 'dv-lottery' },
        { country: 'uk', document: 'passport' },
      ]),
    ).toBe(3);
  });

  it('keys on the pair, not on either half', () => {
    // `us/passport` and `uk/passport` share a document slug; `us/passport` and
    // `us/dv-lottery` share a country. Keying on either alone undercounts.
    expect(
      countDistinctDocuments([
        { country: 'schengen', document: 'visa' },
        { country: 'cn', document: 'visa' },
      ]),
    ).toBe(2);
  });

  it('counts nothing as nothing', () => {
    // The honest answer while no spec is verified, and not a reason to throw.
    expect(countDistinctDocuments([])).toBe(0);
  });

  it('accepts spec frontmatter whole, extra fields and all', () => {
    // getVerifiedDocumentCount passes `entry.data` in without projecting it.
    const entryData = {
      country: 'us',
      countryName: 'United States',
      document: 'passport',
      documentName: 'US passport photo',
      status: 'verified',
    };
    expect(countDistinctDocuments([entryData, entryData])).toBe(1);
  });
});

// Reading the page's source, for the reason tests/i18n/base-layout.test.ts gives at
// length: vitest runs with no Astro compiler in front of it. Swapping the site-wide
// count back for a per-locale one is a one-identifier edit that every assertion
// above stays green through, and the sentence it feeds then reads "0" in ten of the
// eleven locales.
describe('the about page counts the site, not the locale', () => {
  const page = readFileSync(
    fileURLToPath(new URL('../../src/pages/[locale]/about.astro', import.meta.url)),
    'utf8',
  );

  it('feeds about.honest-p1 from the site-wide count', () => {
    expect(page).toContain('getVerifiedDocumentCount()');
    expect(page).not.toContain('getVerifiedSpecPages');
  });
});

// `localesWithDocument` decides the hreflang set of one document page. The whole
// point is that it is NOT "every locale": a spec becomes a page only once a human
// marks it `verified`, and every one of the sixty non-English specs is marked
// `needs-review`, so a document existing in en-US alone is the steady state for a
// while rather than a transient. hreflang naming a URL that 404s is an error
// Google can charge to the entire cluster, so this is the guard on it.
describe('localesWithDocument', () => {
  const published: LocalePublications[] = [
    { locale: 'de-DE', documents: [{ country: 'schengen', document: 'visa' }] },
    {
      locale: 'en-US',
      documents: [
        { country: 'us', document: 'passport' },
        { country: 'schengen', document: 'visa' },
      ],
    },
    { locale: 'ja-JP', documents: [] },
    { locale: 'zh-CN', documents: [{ country: 'us', document: 'dv-lottery' }] },
  ];

  it('names only the locales that publish that document', () => {
    expect(localesWithDocument(published, { country: 'schengen', document: 'visa' })).toEqual([
      'de-DE',
      'en-US',
    ]);
    expect(localesWithDocument(published, { country: 'us', document: 'passport' })).toEqual([
      'en-US',
    ]);
  });

  it('returns nothing for a document no locale publishes', () => {
    // An empty set is a real answer, not a bug: the layout then emits no
    // alternates at all rather than eleven guesses.
    expect(localesWithDocument(published, { country: 'ca', document: 'passport' })).toEqual([]);
    expect(localesWithDocument([], { country: 'us', document: 'passport' })).toEqual([]);
  });

  it('matches on the pair, not on either half', () => {
    // `us/passport` and `us/dv-lottery` are different pages in the same country,
    // and `schengen/visa` and a hypothetical `cn/visa` share a document slug.
    // Matching either half alone would advertise one page's alternates on
    // another's URL.
    expect(localesWithDocument(published, { country: 'us', document: 'dv-lottery' })).toEqual([
      'zh-CN',
    ]);
    expect(localesWithDocument(published, { country: 'cn', document: 'visa' })).toEqual([]);
  });

  it('keeps the order it was given, which is the configured locale order', () => {
    // The page builds its input by mapping over `locales`, so the hreflang set
    // comes out in a stable, reviewable order rather than content order.
    const reversed = [...published].reverse();
    expect(localesWithDocument(reversed, { country: 'schengen', document: 'visa' })).toEqual([
      'en-US',
      'de-DE',
    ]);
  });

  it('accepts a spec entry whole, extra frontmatter fields and all', () => {
    // The page passes `entry.data` straight in rather than projecting it first.
    const entryData = {
      country: 'us',
      countryName: 'United States',
      document: 'passport',
      documentName: 'US passport photo',
      status: 'verified',
    };
    expect(localesWithDocument(published, entryData)).toEqual(['en-US']);
  });
});

// The one predicate the whole accuracy premise rests on, and until now the only
// helper in this module without a test. Weaken it to `!== 'needs-review'` and the
// build goes from 50 pages to 111 at exit 0, publishing sixty untranslated English
// specs under ten locales' `lang`.
describe('isPublished', () => {
  it('publishes a verified spec', () => {
    expect(isPublished({ status: 'verified' })).toBe(true);
  });

  it('holds back one awaiting review', () => {
    expect(isPublished({ status: 'needs-review' })).toBe(false);
  });

  it('holds back a status it has never heard of', () => {
    // The gate is an allow-list, not a deny-list. `status` is a Zod enum today and
    // enums grow; a later `draft` or `retired` must not publish because nobody
    // remembered to add it to an exclusion list.
    for (const status of ['draft', 'retired', 'Verified', 'verified ', '', 'true']) {
      expect(isPublished({ status }), `"${status}" must not publish`).toBe(false);
    }
  });

  it('reads a spec entry whole, extra frontmatter fields and all', () => {
    // src/lib/specs.ts passes `entry.data` straight in, never a literal, so the
    // entry goes through a binding here too: an object literal would meet
    // TypeScript's excess-property check instead of the structural one the real
    // caller gets, and `Publishable` stays narrow to the one field it reads.
    const entryData = {
      country: 'us',
      document: 'passport',
      status: 'verified',
      sourceUrl: 'https://example.com',
    };
    expect(isPublished(entryData)).toBe(true);
  });
});
