import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';

import { DEFAULT_LOCALE, LOCALES } from '../../astro.locales.mjs';

// The locale list exists twice on purpose: astro.locales.mjs is the build-time
// copy (plain literals, no imports, safe to load inside Astro's config loader)
// and src/i18n/config.ts is the runtime copy. Nothing links them, so this file
// imports both and compares them by value.
//
// NOTE: if src/i18n/config.ts and astro.locales.mjs are ever unified into a
// single module that both the config loader and the runtime import, this file
// can be deleted outright.
const EXPECTED_LOCALE_COUNT = 11;

const ASTRO_CONFIG_PATH = fileURLToPath(new URL('../../astro.config.mjs', import.meta.url));
const CONFIG_SOURCE = readFileSync(ASTRO_CONFIG_PATH, 'utf8');

// The one thing a value import cannot see: whether astro.config.mjs hands
// LOCALES on *unmodified*. Requiring the trailing comma rejects a staged-rollout
// edit like `LOCALES.filter(...)` or `LOCALES.slice(0, 2)`, and the
// backreference pins the sitemap map to an identity mapping, so
// `[locale, 'en-US']` and `[l.toLowerCase(), l]` fail instead of passing.
const ASTRO_LOCALES_PASSED_THROUGH = /\blocales\s*:\s*LOCALES\s*,/;
const SITEMAP_LOCALES_DERIVED =
  /\blocales\s*:\s*Object\.fromEntries\(\s*LOCALES\.map\(\s*(\w+)\s*=>\s*\[\s*\1\s*,\s*\1\s*\]\s*\)\s*\)/;
const LOCALES_RESTATED_AS_LITERAL = /\blocales\s*:\s*[[{]/;

describe('astro.locales.mjs matches src/i18n/config.ts', () => {
  it('declares the same locales', () => {
    expect([...LOCALES].sort()).toEqual([...locales].sort());
  });

  it('declares exactly 11 locales on both sides', () => {
    expect(LOCALES).toHaveLength(EXPECTED_LOCALE_COUNT);
    expect(locales).toHaveLength(EXPECTED_LOCALE_COUNT);
  });

  it('declares the same defaultLocale', () => {
    expect(DEFAULT_LOCALE).toBe(defaultLocale);
  });
});

describe('astro.config.mjs passes those locales through unmodified', () => {
  it('hands LOCALES straight to Astro i18n', () => {
    expect(CONFIG_SOURCE).toMatch(ASTRO_LOCALES_PASSED_THROUGH);
  });

  it('derives the @astrojs/sitemap map from LOCALES as an identity mapping', () => {
    expect(CONFIG_SOURCE).toMatch(SITEMAP_LOCALES_DERIVED);
  });

  it('never restates a locale list as an inline literal', () => {
    expect(CONFIG_SOURCE).not.toMatch(LOCALES_RESTATED_AS_LITERAL);
  });
});

// `src/pages/index.astro` is a client-side language chooser whose canonical is
// `/en-US`, and a sitemap should list canonical URLs only. @astrojs/sitemap also
// reads an unprefixed URL as the default-locale page, so with `/` listed the
// apex cluster carries `hreflang="en-US"` twice — once for `/`, once for
// `/en-US`. One language mapped to two URLs is invalid, and Google may drop the
// cluster, taking all eleven locale pages with it. Deleting the filter is a
// one-line, invisible regression, hence a guard.
const SITEMAP_EXCLUDES_APEX = /sitemap\(\{[\s\S]*?\bfilter\s*:[^\n]*pathname\s*!==\s*'\/'/;

describe('astro.config.mjs keeps the apex out of the sitemap', () => {
  it('filters the root path out of @astrojs/sitemap', () => {
    expect(CONFIG_SOURCE).toMatch(SITEMAP_EXCLUDES_APEX);
  });
});

// An untranslated locale's pages are English served under a foreign `lang`. They
// canonicalise to the en-US page they duplicate (see src/i18n/alternates.ts), and a
// sitemap that lists a non-canonical URL asks Google to index a duplicate — so the
// same filter drops them. Deleting this half is invisible in every built page and
// shows up only in sitemap-0.xml, which nothing else reads.
const SITEMAP_EXCLUDES_UNTRANSLATED = /sitemap\(\{[\s\S]*?\bfilter\s*:[^\n]*isTranslatedPage\(/;
const TRANSLATED_DERIVED = /const TRANSLATED\s*=\s*readTranslatedLocales\(\)/;
const TRANSLATED_RESTATED_AS_LITERAL = /const TRANSLATED\s*=\s*[[{]/;

describe('astro.config.mjs keeps untranslated locales out of the sitemap', () => {
  it('filters pages whose locale has not been translated', () => {
    expect(CONFIG_SOURCE).toMatch(SITEMAP_EXCLUDES_UNTRANSLATED);
  });

  it('reads that list from the bundles rather than restating it', () => {
    // A literal here would be a fourth hand-maintained locale list, and the one
    // most likely to rot: it changes every time a translator finishes a language.
    expect(CONFIG_SOURCE).toMatch(TRANSLATED_DERIVED);
    expect(CONFIG_SOURCE).not.toMatch(TRANSLATED_RESTATED_AS_LITERAL);
  });

  it('still hands Astro every locale, so the pages stay built and reachable', () => {
    // The narrowing is a claim to crawlers, not a routing change. Narrowing
    // Astro's own i18n would 404 ten locales for readers.
    expect(CONFIG_SOURCE).toMatch(ASTRO_LOCALES_PASSED_THROUGH);
    expect(CONFIG_SOURCE).not.toMatch(/\blocales\s*:\s*TRANSLATED\b/);
  });
});
