import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';

// The locale list lives in three places: Astro's own `i18n` config, the
// @astrojs/sitemap integration's `i18n` option (the integration never derives
// its own from Astro's), and the runtime module. Nothing links them, so this
// guard compares all three as text. Importing astro.config.mjs would drag in
// every integration and Vite plugin, which plain vitest (no Astro plugin)
// cannot be relied on to load.
const ASTRO_CONFIG_PATH = fileURLToPath(new URL('../../astro.config.mjs', import.meta.url));

const CONFIG_SOURCE = readFileSync(ASTRO_CONFIG_PATH, 'utf8');

const EXPECTED_LOCALE_COUNT = 11;

const NO_I18N_FIXTURE = 'export default defineConfig({ site: "https://example.test" });';

/**
 * Returns the object literal starting at `openBraceIndex`, honouring nested
 * braces, string literals and comments. Null when the braces never balance.
 */
function readBalancedBlock(source: string, openBraceIndex: number): string | null {
  let depth = 0;
  let quote: string | null = null;
  let index = openBraceIndex;

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (quote !== null) {
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', index);
      index = lineEnd === -1 ? source.length : lineEnd + 1;
      continue;
    }

    if (char === '/' && next === '*') {
      const commentEnd = source.indexOf('*/', index + 2);
      index = commentEnd === -1 ? source.length : commentEnd + 2;
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex, index + 1);
      }
    }

    index += 1;
  }

  return null;
}

/** Every `i18n: { ... }` object literal in the source, in file order. */
function collectI18nBlocks(source: string): string[] {
  const blocks: string[] = [];
  const keyPattern = /\bi18n\s*:\s*\{/g;

  let match = keyPattern.exec(source);
  while (match !== null) {
    // `lastIndex - 1` is the `{` the pattern just consumed.
    const block = readBalancedBlock(source, keyPattern.lastIndex - 1);
    if (block !== null) {
      blocks.push(block);
    }
    match = keyPattern.exec(source);
  }

  return blocks;
}

interface I18nBlockShape {
  readonly owner: string;
  readonly shape: string;
  readonly localesPattern: RegExp;
}

// The two `i18n` blocks are told apart by their `locales` value: an array
// literal for Astro, an object map for @astrojs/sitemap.
const ASTRO_BLOCK: I18nBlockShape = {
  owner: 'Astro',
  shape: 'locales: [...] array',
  localesPattern: /\blocales\s*:\s*\[/,
};

const SITEMAP_BLOCK: I18nBlockShape = {
  owner: '@astrojs/sitemap',
  shape: 'locales: { ... } object map',
  localesPattern: /\blocales\s*:\s*\{/,
};

function extractI18nBlock(source: string, label: string, wanted: I18nBlockShape): string {
  const blocks = collectI18nBlocks(source);
  const found = blocks.find(block => wanted.localesPattern.test(block));

  if (found === undefined) {
    throw new Error(
      `[locale parity guard] No ${wanted.owner} i18n block with a "${wanted.shape}" in ${label} ` +
        `(${blocks.length} i18n block(s) parsed). There is nothing to compare, so this guard ` +
        `must fail rather than pass on an empty match — fix the config or this parser.`,
    );
  }

  return found;
}

function extractLocales(block: string, label: string): string[] {
  const arrayBody = /\blocales\s*:\s*\[([^\]]*)\]/.exec(block)?.[1];
  if (arrayBody === undefined) {
    throw new Error(`[locale parity guard] Could not read the "locales: [...]" array from ${label}.`);
  }

  const parsed = [...arrayBody.matchAll(/['"]([^'"]+)['"]/g)]
    .map(match => match[1])
    .filter((value): value is string => value !== undefined);

  if (parsed.length === 0) {
    throw new Error(`[locale parity guard] The "locales" array in ${label} parsed to zero entries.`);
  }

  return parsed;
}

/**
 * The `locales: { 'de-DE': 'de-DE', ... }` map from @astrojs/sitemap's `i18n`
 * option: URL path segment -> hreflang code.
 */
function extractLocaleMap(block: string, label: string): ReadonlyMap<string, string> {
  const keyPattern = /\blocales\s*:\s*\{/g;
  if (keyPattern.exec(block) === null) {
    throw new Error(
      `[locale parity guard] Could not find a "locales: { ... }" object map inside the ` +
        `@astrojs/sitemap i18n block in ${label}.`,
    );
  }

  const mapBlock = readBalancedBlock(block, keyPattern.lastIndex - 1);
  if (mapBlock === null) {
    throw new Error(
      `[locale parity guard] The braces of the @astrojs/sitemap "locales" object map in ${label} never balance.`,
    );
  }

  const pairs = [...mapBlock.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)].flatMap(match => {
    const segment = match[1];
    const hreflang = match[2];
    return segment === undefined || hreflang === undefined ? [] : [[segment, hreflang] as const];
  });

  if (pairs.length === 0) {
    throw new Error(
      `[locale parity guard] The @astrojs/sitemap "locales" object map in ${label} parsed to zero entries.`,
    );
  }

  return new Map(pairs);
}

function extractDefaultLocale(block: string, label: string): string {
  const parsed = /\bdefaultLocale\s*:\s*['"]([^'"]+)['"]/.exec(block)?.[1];
  if (parsed === undefined) {
    throw new Error(`[locale parity guard] Could not read "defaultLocale" from the i18n block in ${label}.`);
  }

  return parsed;
}

describe('astro.config.mjs and src/i18n/config.ts agree on locales', () => {
  const i18nBlock = extractI18nBlock(CONFIG_SOURCE, ASTRO_CONFIG_PATH, ASTRO_BLOCK);
  const configLocales = extractLocales(i18nBlock, ASTRO_CONFIG_PATH);

  it('lists exactly the locales exported by @/i18n/config', () => {
    expect([...configLocales].sort()).toEqual([...locales].sort());
  });

  it('lists exactly 11 locales on both sides', () => {
    expect(configLocales).toHaveLength(EXPECTED_LOCALE_COUNT);
    expect(locales).toHaveLength(EXPECTED_LOCALE_COUNT);
  });

  it('declares the same defaultLocale as @/i18n/config', () => {
    expect(extractDefaultLocale(i18nBlock, ASTRO_CONFIG_PATH)).toBe(defaultLocale);
  });

  it('throws instead of matching nothing when the i18n block is missing', () => {
    expect(() => extractI18nBlock(NO_I18N_FIXTURE, 'fixture.mjs', ASTRO_BLOCK)).toThrow(/No Astro i18n block/);
  });
});

// @astrojs/sitemap reads only its own `i18n` option, so a locale added to
// src/i18n/config.ts and to Astro's `i18n` but forgotten here would build fine
// and silently ship without hreflang alternates.
describe("astro.config.mjs's @astrojs/sitemap i18n map agrees with src/i18n/config.ts", () => {
  const sitemapBlock = extractI18nBlock(CONFIG_SOURCE, ASTRO_CONFIG_PATH, SITEMAP_BLOCK);
  const localeMap = extractLocaleMap(sitemapBlock, ASTRO_CONFIG_PATH);

  it('maps exactly the locales exported by @/i18n/config', () => {
    expect([...localeMap.keys()].sort()).toEqual([...locales].sort());
  });

  it('maps exactly 11 locales', () => {
    expect(localeMap.size).toBe(EXPECTED_LOCALE_COUNT);
  });

  it('maps every URL path segment to an identical hreflang code', () => {
    const mismatched = [...localeMap.entries()].filter(([segment, hreflang]) => segment !== hreflang);
    expect(mismatched).toEqual([]);
  });

  it('declares the same defaultLocale as @/i18n/config', () => {
    expect(extractDefaultLocale(sitemapBlock, ASTRO_CONFIG_PATH)).toBe(defaultLocale);
  });

  it('throws instead of matching nothing when the sitemap i18n block is missing', () => {
    expect(() => extractI18nBlock(NO_I18N_FIXTURE, 'fixture.mjs', SITEMAP_BLOCK)).toThrow(
      /No @astrojs\/sitemap i18n block/,
    );
  });

  it('throws instead of matching nothing when the locales map is missing', () => {
    expect(() => extractLocaleMap("{ defaultLocale: 'en-US' }", 'fixture.mjs')).toThrow(
      /Could not find a "locales: \{ \.\.\. \}" object map/,
    );
  });
});
