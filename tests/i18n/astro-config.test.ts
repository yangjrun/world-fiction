import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';

// astro.config.mjs keeps its own plain-JS copy of the locale list, because
// importing src/i18n/config.ts from inside the config loader would mean a
// resolution failure there stops every build. This guard keeps the two honest.
//
// The config funnels every locale list through two consts, so there is exactly
// one array literal and one default-locale string to compare here, and the
// sitemap map is derived from the array rather than restated.
//
// NOTE: if these lists are ever genuinely derived from src/i18n/config.ts —
// imported rather than duplicated — this whole file becomes dead weight and
// should be deleted. Until then the guard deliberately trips that refactor.
const ASTRO_CONFIG_PATH = fileURLToPath(new URL('../../astro.config.mjs', import.meta.url));

const LOCALES_CONST = 'LOCALES';
const DEFAULT_LOCALE_CONST = 'DEFAULT_LOCALE';

const EXPECTED_LOCALE_COUNT = 11;

// Astro's own `i18n` and the one handed to sitemap(). Exactly two, never more.
const EXPECTED_I18N_BLOCK_COUNT = 2;

// `locales`/`defaultLocale` must reference the consts, never restate a literal —
// otherwise the consts could go stale while the guard reads dead code.
const ASTRO_LOCALES_REFERENCE = /\blocales\s*:\s*LOCALES\b/;
const SITEMAP_DERIVED_LOCALES = /\blocales\s*:\s*Object\.fromEntries\(\s*LOCALES\s*\.map\(/;
const DEFAULT_LOCALE_REFERENCE = /\bdefaultLocale\s*:\s*DEFAULT_LOCALE\b/;
const ARRAY_LITERAL_LOCALES = /\blocales\s*:\s*\[/;
const OBJECT_LITERAL_LOCALES = /\blocales\s*:\s*\{/;

const NO_I18N_FIXTURE = 'export default defineConfig({ site: "https://example.test" });';

/**
 * Drops `//` and block comments while keeping string literals intact, so no
 * extractor below can be fooled by a commented-out entry or by a locale that is
 * only named in a note. Every extractor runs on the stripped text.
 *
 * A regex literal containing `/` would confuse this; the config has none, and
 * the block-count assertions would fail loudly rather than quietly if one
 * appeared.
 */
function stripComments(source: string): string {
  let stripped = '';
  let quote: string | null = null;
  let index = 0;

  while (index < source.length) {
    const char = source[index] ?? '';
    const next = source[index + 1];

    if (quote !== null) {
      if (char === '\\') {
        stripped += char + (next ?? '');
        index += 2;
        continue;
      }
      if (char === quote) {
        quote = null;
      }
      stripped += char;
      index += 1;
      continue;
    }

    if (char === '/' && next === '/') {
      const lineEnd = source.indexOf('\n', index);
      // Stop before the newline so line structure survives.
      index = lineEnd === -1 ? source.length : lineEnd;
      continue;
    }

    if (char === '/' && next === '*') {
      const commentEnd = source.indexOf('*/', index + 2);
      index = commentEnd === -1 ? source.length : commentEnd + 2;
      stripped += ' ';
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
    }

    stripped += char;
    index += 1;
  }

  return stripped;
}

/**
 * The balanced `open`..`close` region starting at `openIndex`, honouring string
 * literals. Null when the delimiters never balance. Input must be comment-free.
 */
function readBalancedRegion(source: string, openIndex: number, open: string, close: string): string | null {
  let depth = 0;
  let quote: string | null = null;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote !== null) {
      if (char === '\\') {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
    } else if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openIndex, index + 1);
      }
    }
  }

  return null;
}

interface FoundBlock {
  readonly start: number;
  readonly text: string;
}

/** Every `i18n: { ... }` object literal in the (comment-free) source. */
function collectI18nBlocks(source: string): FoundBlock[] {
  const blocks: FoundBlock[] = [];
  const keyPattern = /\bi18n\s*:\s*\{/g;

  let match = keyPattern.exec(source);
  while (match !== null) {
    // `lastIndex - 1` is the `{` the pattern just consumed.
    const start = keyPattern.lastIndex - 1;
    const text = readBalancedRegion(source, start, '{', '}');
    if (text !== null) {
      blocks.push({ start, text });
    }
    match = keyPattern.exec(source);
  }

  return blocks;
}

/** Character range of the single `sitemap(...)` call's argument list. */
function readSitemapCall(source: string, label: string): { readonly start: number; readonly end: number } {
  const callPattern = /\bsitemap\s*\(/g;
  const opens: number[] = [];

  let match = callPattern.exec(source);
  while (match !== null) {
    opens.push(callPattern.lastIndex - 1);
    match = callPattern.exec(source);
  }

  const start = opens.length === 1 ? opens[0] : undefined;
  if (start === undefined) {
    throw new Error(
      `[locale parity guard] Expected exactly 1 "sitemap(" call in ${label}, found ${opens.length}. ` +
        `The sitemap i18n block is anchored on that call, so the guard cannot tell which block is whose.`,
    );
  }

  const args = readBalancedRegion(source, start, '(', ')');
  if (args === null) {
    throw new Error(`[locale parity guard] The parentheses of the "sitemap(" call in ${label} never balance.`);
  }

  return { start, end: start + args.length };
}

/**
 * The two i18n blocks, told apart by which call encloses them rather than by
 * shape: shape alone let a stray or documentation-shaped block win the match.
 */
function extractI18nBlocks(source: string, label: string): { readonly astro: string; readonly sitemap: string } {
  const blocks = collectI18nBlocks(source);

  if (blocks.length !== EXPECTED_I18N_BLOCK_COUNT) {
    throw new Error(
      `[locale parity guard] Expected exactly ${EXPECTED_I18N_BLOCK_COUNT} i18n blocks in ${label} ` +
        `(Astro's own plus the one passed to sitemap()), found ${blocks.length}. A missing, stray or ` +
        `duplicated block means the guard could be reading the wrong one — fix the config or this parser.`,
    );
  }

  const call = readSitemapCall(source, label);
  const inside = blocks.filter(block => block.start > call.start && block.start < call.end);
  const outside = blocks.filter(block => block.start < call.start || block.start > call.end);

  const sitemapBlock = inside.length === 1 ? inside[0]?.text : undefined;
  const astroBlock = outside.length === 1 ? outside[0]?.text : undefined;
  if (sitemapBlock === undefined || astroBlock === undefined) {
    throw new Error(
      `[locale parity guard] Expected exactly 1 i18n block inside the "sitemap(" call and 1 outside it ` +
        `in ${label}, found ${inside.length} inside and ${outside.length} outside.`,
    );
  }

  return { astro: astroBlock, sitemap: sitemapBlock };
}

function extractConstArray(source: string, label: string, name: string): string[] {
  const body = new RegExp(`\\bconst\\s+${name}\\s*=\\s*\\[([^\\]]*)\\]`).exec(source)?.[1];
  if (body === undefined) {
    throw new Error(
      `[locale parity guard] Could not read "const ${name} = [...]" from ${label}. There is nothing ` +
        `to compare, so this guard must fail rather than pass on an empty match.`,
    );
  }

  const parsed = [...body.matchAll(/['"]([^'"]+)['"]/g)]
    .map(match => match[1])
    .filter((value): value is string => value !== undefined);

  if (parsed.length === 0) {
    throw new Error(`[locale parity guard] "const ${name} = [...]" in ${label} parsed to zero entries.`);
  }

  return parsed;
}

function extractConstString(source: string, label: string, name: string): string {
  const parsed = new RegExp(`\\bconst\\s+${name}\\s*=\\s*['"]([^'"]+)['"]`).exec(source)?.[1];
  if (parsed === undefined) {
    throw new Error(
      `[locale parity guard] Could not read "const ${name} = '...'" from ${label}. There is nothing ` +
        `to compare, so this guard must fail rather than pass on an empty match.`,
    );
  }

  return parsed;
}

const CONFIG_SOURCE = stripComments(readFileSync(ASTRO_CONFIG_PATH, 'utf8'));

describe('astro.config.mjs locale consts match src/i18n/config.ts', () => {
  const configLocales = extractConstArray(CONFIG_SOURCE, ASTRO_CONFIG_PATH, LOCALES_CONST);
  const { astro: astroBlock } = extractI18nBlocks(CONFIG_SOURCE, ASTRO_CONFIG_PATH);

  it(`declares in ${LOCALES_CONST} exactly the locales exported by @/i18n/config`, () => {
    expect([...configLocales].sort()).toEqual([...locales].sort());
  });

  it('declares exactly 11 locales on both sides', () => {
    expect(configLocales).toHaveLength(EXPECTED_LOCALE_COUNT);
    expect(locales).toHaveLength(EXPECTED_LOCALE_COUNT);
  });

  it(`declares in ${DEFAULT_LOCALE_CONST} the same defaultLocale as @/i18n/config`, () => {
    expect(extractConstString(CONFIG_SOURCE, ASTRO_CONFIG_PATH, DEFAULT_LOCALE_CONST)).toBe(defaultLocale);
  });

  it('wires Astro i18n to those consts instead of restating literals', () => {
    expect(astroBlock).toMatch(ASTRO_LOCALES_REFERENCE);
    expect(astroBlock).toMatch(DEFAULT_LOCALE_REFERENCE);
    expect(astroBlock).not.toMatch(ARRAY_LITERAL_LOCALES);
  });
});

// @astrojs/sitemap reads only its own `i18n` option and never Astro's, so its
// map used to be a third hand-written copy. It is now derived from LOCALES; this
// suite exists to stop anyone re-expanding it into an unguarded literal.
describe('astro.config.mjs derives the @astrojs/sitemap i18n map from the same consts', () => {
  const { sitemap: sitemapBlock } = extractI18nBlocks(CONFIG_SOURCE, ASTRO_CONFIG_PATH);

  it(`derives locales from ${LOCALES_CONST} rather than restating them`, () => {
    expect(sitemapBlock).toMatch(SITEMAP_DERIVED_LOCALES);
  });

  it('does not restate the map as an object or array literal', () => {
    expect(sitemapBlock).not.toMatch(OBJECT_LITERAL_LOCALES);
    expect(sitemapBlock).not.toMatch(ARRAY_LITERAL_LOCALES);
  });

  it(`resolves its defaultLocale to ${DEFAULT_LOCALE_CONST}`, () => {
    expect(sitemapBlock).toMatch(DEFAULT_LOCALE_REFERENCE);
    expect(extractConstString(CONFIG_SOURCE, ASTRO_CONFIG_PATH, DEFAULT_LOCALE_CONST)).toBe(defaultLocale);
  });
});

// The guard is only worth anything if it cannot pass on zero matches, and it
// must read code rather than comments.
describe('astro.config.mjs guard fails loudly instead of matching nothing', () => {
  it('throws when there is no i18n block at all', () => {
    expect(() => extractI18nBlocks(stripComments(NO_I18N_FIXTURE), 'fixture.mjs')).toThrow(
      /Expected exactly 2 i18n blocks/,
    );
  });

  it('throws when a duplicate i18n block appears', () => {
    const fixture = `
      const LOCALES = ['en-US'];
      export default defineConfig({
        i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES },
        integrations: [sitemap({ i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES } })],
        stray: { i18n: { defaultLocale: 'en-US', locales: ['XX-XX'] } },
      });`;
    expect(() => extractI18nBlocks(stripComments(fixture), 'fixture.mjs')).toThrow(/found 3/);
  });

  it('throws when the sitemap i18n block moves to another call', () => {
    const fixture = `
      export default defineConfig({
        i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES },
        integrations: [vue({ i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES } }), sitemap()],
      });`;
    expect(() => extractI18nBlocks(stripComments(fixture), 'fixture.mjs')).toThrow(
      /found 0 inside and 2 outside/,
    );
  });

  it(`throws when const ${LOCALES_CONST} is gone`, () => {
    expect(() => extractConstArray('const OTHER = [1];', 'fixture.mjs', LOCALES_CONST)).toThrow(
      /Could not read "const LOCALES = \[\.\.\.\]"/,
    );
  });

  it(`throws when const ${DEFAULT_LOCALE_CONST} is gone`, () => {
    expect(() => extractConstString('const OTHER = 1;', 'fixture.mjs', DEFAULT_LOCALE_CONST)).toThrow(
      /Could not read "const DEFAULT_LOCALE = '\.\.\.'"/,
    );
  });

  it('does not count a commented-out locale as present', () => {
    const fixture = "const LOCALES = [\n  'de-DE',\n  // 'nl-NL',\n  'en-US',\n];";
    expect(extractConstArray(stripComments(fixture), 'fixture.mjs', LOCALES_CONST)).toEqual(['de-DE', 'en-US']);
  });

  it('does not count a locale that only appears in a note comment', () => {
    const fixture = "// dropped 'nl-NL' pending translations\nconst LOCALES = ['de-DE', 'en-US'];";
    expect(extractConstArray(stripComments(fixture), 'fixture.mjs', LOCALES_CONST)).toEqual(['de-DE', 'en-US']);
  });

  it('does not count a commented-out i18n block or sitemap call', () => {
    const fixture = `
      /* reference shape: sitemap({ i18n: { locales: { 'de-DE': 'de-DE' } } }) */
      export default defineConfig({
        i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES },
        integrations: [sitemap({ i18n: { defaultLocale: DEFAULT_LOCALE, locales: LOCALES } })],
      });`;
    expect(() => extractI18nBlocks(stripComments(fixture), 'fixture.mjs')).not.toThrow();
  });

  it('keeps string literals that contain slashes', () => {
    const stripped = stripComments("const SITE = 'https://example.com'; // TODO(deploy)");
    expect(stripped).toContain("'https://example.com'");
    expect(stripped).not.toContain('TODO');
  });
});

