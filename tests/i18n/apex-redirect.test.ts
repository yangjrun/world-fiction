import { describe, expect, it } from 'vitest';

import { apexRedirectScript } from '@/i18n/apex-redirect';
import { defaultLocale, locales } from '@/i18n/config';
import { detectLocale } from '@/i18n/detect-locale';

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
  ['zh-Hant'],
  ['pt-BR', 'pt'],
  ['en-GB', 'en'],
  ['es-MX', 'es'],
  ['nl-BE'],
  ['ko'],
  // A later exact match must beat an earlier prefix-only one.
  ['de-AT', 'fr-FR'],
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
    // The reason the exact pass runs over the whole list before the prefix pass:
    // a Taiwanese reader must not be handed Simplified Chinese.
    expect(target({ languages: ['zh-TW'] })).toBe('/zh-TW');
    expect(target({ languages: ['zh'] })).toBe('/zh-CN');
    expect(target({ languages: ['de-AT', 'fr-FR'] })).toBe('/fr-FR');
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
    const quoted = apexRedirectScript.match(/"[A-Za-z]{2}-[A-Za-z]{2}"/g) ?? [];
    const found = [...new Set(quoted.map((q) => q.slice(1, -1)))];
    expect(found.sort()).toEqual([...locales].sort());
  });

  describe('agrees with detectLocale', () => {
    for (const tags of TAG_LISTS) {
      it(`resolves ${asHeader(tags)} the same way`, () => {
        expect(target({ languages: tags })).toBe(`/${detectLocale(asHeader(tags))}`);
      });
    }
  });
});
