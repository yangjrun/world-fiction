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
