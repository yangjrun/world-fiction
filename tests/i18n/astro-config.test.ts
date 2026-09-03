import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';

// The locale list lives in two places: Astro's build-time config and the
// runtime module. Nothing links them, so this guard compares them as text.
// Importing astro.config.mjs would drag in every integration and Vite plugin,
// which plain vitest (no Astro plugin) cannot be relied on to load.
const ASTRO_CONFIG_PATH = fileURLToPath(new URL('../../astro.config.mjs', import.meta.url));

const EXPECTED_LOCALE_COUNT = 11;

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

/**
 * Astro's own `i18n` block, told apart from @astrojs/sitemap's `i18n` option by
 * its `locales` value: an array literal here, an object map there.
 */
function extractAstroI18nBlock(source: string, label: string): string {
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

  const astroBlock = blocks.find(block => /\blocales\s*:\s*\[/.test(block));
  if (astroBlock === undefined) {
    throw new Error(
      `[locale parity guard] No Astro i18n block with a "locales: [...]" array in ${label} ` +
        `(${blocks.length} i18n block(s) parsed). There is nothing to compare, so this guard ` +
        `must fail rather than pass on an empty match — fix the config or this parser.`,
    );
  }

  return astroBlock;
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

function extractDefaultLocale(block: string, label: string): string {
  const parsed = /\bdefaultLocale\s*:\s*['"]([^'"]+)['"]/.exec(block)?.[1];
  if (parsed === undefined) {
    throw new Error(`[locale parity guard] Could not read "defaultLocale" from the i18n block in ${label}.`);
  }

  return parsed;
}

describe('astro.config.mjs and src/i18n/config.ts agree on locales', () => {
  const i18nBlock = extractAstroI18nBlock(readFileSync(ASTRO_CONFIG_PATH, 'utf8'), ASTRO_CONFIG_PATH);
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
    expect(() =>
      extractAstroI18nBlock('export default defineConfig({ site: "https://example.test" });', 'fixture.mjs'),
    ).toThrow(/No Astro i18n block/);
  });
});
