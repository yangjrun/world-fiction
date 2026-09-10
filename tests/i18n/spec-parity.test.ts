import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { defaultLocale, locales } from '@/i18n/config';
import { isPublished } from '@/lib/specs-locale';

/**
 * What must stay identical across locales, and what may not.
 *
 * All sixty non-English specs are copies of the six en-US files, and the field most
 * likely to mislead is `sourceCheckedOn`: it says a person read the official source
 * on that date, and none of them has been read in any language but English.
 *
 * A rule requiring that date to differ from en-US cannot work, which is why the one
 * this file replaced is gone. Re-reading the source on the same day yields the
 * identical value, so the rule fires on a correct file; and a translator who changes
 * the date without reading anything passes it. It proves nothing either way.
 *
 * These three invariants are checkable. The first is the one with teeth: an
 * authority's millimetres do not vary by language, so every locale's numbers and
 * `sourceUrl` must equal the default locale's. That catches a translator editing a
 * number, a re-checked en-US spec whose correction never propagated, and a stale
 * copy drifting -- none of which any rule about a date would notice.
 *
 * Frontmatter is read as text rather than with a YAML parser: adding a dependency to
 * compare fields in a format this repo controls is a poor trade, and the comparison
 * below is fail-closed, so a field nobody thought about is compared rather than
 * skipped.
 */
const SPECS_DIR = fileURLToPath(new URL('../../src/content/specs', import.meta.url));

/**
 * The frontmatter blocks a translator is expected to rewrite.
 *
 * Everything else is compared. Deliberately an exclusion list and not an inclusion
 * list: a numeric field added to `src/content.config.ts` is then covered the day it
 * lands, where an inclusion list would silently stop guarding it.
 */
const TRANSLATABLE = [
  'countryName',
  'documentName',
  'title',
  'description',
  'editorNotice',
  'rejectionReasons',
  'faq',
  // Not prose, but legitimately per-locale: the publication gate and the date a
  // person read the source in that language.
  'status',
  'sourceCheckedOn',
];

const specPath = (locale: string, name: string): string => `${SPECS_DIR}/${locale}/${name}`;
const specsIn = (locale: string): string[] =>
  readdirSync(`${SPECS_DIR}/${locale}`).filter((name) => name.endsWith('.md'));

/** The frontmatter of one spec, as text, or `null` if it has none. */
function frontmatterOf(text: string): string | null {
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? null;
}

/**
 * Frontmatter split into top-level blocks: a key at column 0, plus every indented
 * line beneath it. Nested keys and list items are indented, so they never start one.
 */
function blocksOf(frontmatter: string): Map<string, string> {
  const blocks = new Map<string, string>();
  let key: string | null = null;
  let lines: string[] = [];

  for (const line of frontmatter.split('\n')) {
    const head = /^([A-Za-z][A-Za-z0-9]*):/.exec(line);
    if (head?.[1] !== undefined) {
      if (key !== null) blocks.set(key, lines.join('\n'));
      key = head[1];
      lines = [line];
    } else {
      lines.push(line);
    }
  }
  if (key !== null) blocks.set(key, lines.join('\n'));

  return blocks;
}

/** The blocks stating facts about the document, rather than prose about it. */
function factsOf(frontmatter: string): Map<string, string> {
  const blocks = blocksOf(frontmatter);
  for (const key of TRANSLATABLE) blocks.delete(key);

  // `background` is the one block that mixes the two: a prose description of the
  // colour, and the hex values the authority publishes.
  const background = blocks.get('background');
  if (background !== undefined) {
    blocks.set(
      'background',
      background
        .split('\n')
        .filter((line) => !/^\s+description:/.test(line))
        .join('\n'),
    );
  }

  return blocks;
}

/** Every spec in a non-default locale that also exists in the default locale. */
function translations(): { locale: string; name: string }[] {
  return locales
    .filter((locale) => locale !== defaultLocale)
    .flatMap((locale) =>
      specsIn(locale)
        .filter((name) => existsSync(specPath(defaultLocale, name)))
        .map((name) => ({ locale, name })),
    );
}

describe('the frontmatter reader this file depends on', () => {
  // Guards the guard. Every check below is a no-op if the split stops finding
  // blocks, or if an exclusion name is misspelled and the facts set comes back
  // empty. Both would pass in silence.
  it('finds the blocks it excludes and the facts it keeps', () => {
    const frontmatter = frontmatterOf(
      readFileSync(specPath(defaultLocale, 'uk-passport.md'), 'utf8'),
    );
    expect(frontmatter, 'the reference spec has no frontmatter').not.toBeNull();

    const blocks = blocksOf(frontmatter ?? '');
    for (const key of TRANSLATABLE) {
      expect([...blocks.keys()], `${key} is not a frontmatter block`).toContain(key);
    }

    const facts = factsOf(frontmatter ?? '');
    for (const key of ['country', 'document', 'output', 'headHeight', 'background', 'sourceUrl']) {
      expect([...facts.keys()], `${key} is not being compared`).toContain(key);
    }
    for (const key of TRANSLATABLE) {
      expect([...facts.keys()], `${key} should not be compared`).not.toContain(key);
    }

    // The colours stay, the sentence describing them goes.
    expect(facts.get('background')).toContain('#f0f0f0');
    expect(facts.get('background')).not.toContain('Plain cream or light grey');
  });

  it('has translations to compare at all', () => {
    expect(translations().length).toBeGreaterThanOrEqual(60);
  });
});

describe('a translation states the same facts as its original', () => {
  it('agrees with the default locale on every number and on the source', () => {
    // An authority's millimetres do not vary by language. A locale that disagrees is
    // either publishing a number nobody verified, or holding a correction that never
    // propagated from en-US -- and either way one of the two pages is wrong.
    for (const { locale, name } of translations()) {
      const theirs = frontmatterOf(readFileSync(specPath(locale, name), 'utf8'));
      const ours = frontmatterOf(readFileSync(specPath(defaultLocale, name), 'utf8'));
      expect(theirs, `${locale}/${name} has no frontmatter`).not.toBeNull();
      expect(ours, `${defaultLocale}/${name} has no frontmatter`).not.toBeNull();

      const theirFacts = factsOf(theirs ?? '');
      const ourFacts = factsOf(ours ?? '');

      for (const [key, value] of ourFacts) {
        expect(
          theirFacts.get(key),
          `${locale}/${name} disagrees with ${defaultLocale}/${name} on "${key}". ` +
            `Numbers and sourceUrl are the authority's, not the translator's: copy ` +
            `them from ${defaultLocale} and translate only the prose fields.`,
        ).toBe(value);
      }
      expect(
        [...theirFacts.keys()],
        `${locale}/${name} has a different set of fact fields from ${defaultLocale}/${name}`,
      ).toEqual([...ourFacts.keys()]);
    }
  });
});

describe('a published translation has actually been translated', () => {
  it('never publishes a spec still byte-identical to its English original', () => {
    // Fail-closed, and the one thing about this that is definitional rather than
    // heuristic: a file identical to the en-US original, marked verified, is
    // "cleared for publication without being translated" spelled exactly.
    for (const { locale, name } of translations()) {
      const theirs = readFileSync(specPath(locale, name), 'utf8');
      const frontmatter = frontmatterOf(theirs);
      expect(frontmatter, `${locale}/${name} has no frontmatter`).not.toBeNull();

      const status = /^status:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter ?? '')?.[1];
      expect(status, `${locale}/${name} declares no status`).toBeDefined();
      if (!isPublished({ status: status ?? '' })) continue;

      expect(
        theirs === readFileSync(specPath(defaultLocale, name), 'utf8'),
        `${locale}/${name} is marked verified but is byte-identical to ` +
          `${defaultLocale}/${name}, so publishing it would serve English under ` +
          `lang="${locale}". Translate title, description, countryName, documentName, ` +
          `rejectionReasons and faq, re-read the official source, and set ` +
          `sourceCheckedOn to the date you read it.`,
      ).toBe(false);
    }
  });

  it('never publishes against a source reading older than the English one', () => {
    // The checkable half of what a date can say. Equality proves nothing -- a genuine
    // re-read on the same day is identical -- but a date *earlier* than en-US's means
    // this page's freshness claim predates the reading its own numbers now come from,
    // since the check above requires those numbers to match en-US exactly.
    for (const { locale, name } of translations()) {
      const theirs = frontmatterOf(readFileSync(specPath(locale, name), 'utf8'));
      const status = /^status:[ \t]*(\S+)[ \t]*$/m.exec(theirs ?? '')?.[1];
      if (!isPublished({ status: status ?? '' })) continue;

      const dateOf = (frontmatter: string): string | undefined =>
        /^sourceCheckedOn:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter)?.[1];
      const mine = dateOf(theirs ?? '');
      const source = dateOf(frontmatterOf(readFileSync(specPath(defaultLocale, name), 'utf8')) ?? '');
      expect(mine, `${locale}/${name} declares no sourceCheckedOn`).toBeDefined();
      expect(source, `${defaultLocale}/${name} declares no sourceCheckedOn`).toBeDefined();

      // ISO 8601, so a string comparison is a date comparison.
      expect(
        (mine ?? '') >= (source ?? ''),
        `${locale}/${name} was checked on ${mine}, before ${defaultLocale}/${name} ` +
          `was checked on ${source}. Re-read the official source and set ` +
          `sourceCheckedOn to the date you read it.`,
      ).toBe(true);
    }
  });
});
