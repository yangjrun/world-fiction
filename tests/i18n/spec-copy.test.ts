import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { locales } from '@/i18n/config';
import { isPublished } from '@/lib/specs-locale';

/**
 * The copy Google can show for a spec page is frontmatter, not code, so the
 * guard lives in the test suite like the parity checks do: read the files, fail
 * the build on the same text a reader would see.
 *
 * Three things are pinned here. Lengths, because a title over ~60 characters
 * truncates in results and a description outside 50-170 is either cut off or
 * spammy — `src/content.config.ts` enforces the hard zod bounds, but the usable
 * range inside them is policy, and policy drifts. The English gold strings,
 * because the click-through pattern they carry — "Free Online" up front, the
 * size a searcher typed, "Requirements" for the money query, and the
 * free / in-your-browser / nothing-uploaded triple in the description — is the
 * one lever this site has against gov.uk results at page-one-bottom, and a
 * reworded title can lose it one edit at a time without any test noticing.
 * The pattern check, because gold strings only pin the five files they name.
 *
 * Unpublished specs are skipped: their copy is not what search can show, and a
 * draft's half-finished title is the author's business, not a release gate.
 */
const SPECS_DIR = fileURLToPath(new URL('../../src/content/specs', import.meta.url));

/** The exact copy every published en-US spec page must carry. */
const GOLD: Record<string, { title: string; description: string }> = {
  'ca-passport.md': {
    title: 'Free Online Canadian Passport Photo — 50x70 mm Requirements',
    description:
      'Free 50x70 mm Canadian passport photo maker. Correct 31-36 mm face height, white background and a printable sheet. Works in your browser — nothing is uploaded.',
  },
  'schengen-visa.md': {
    title: 'Free Online Schengen Visa Photo — 35x45 mm Requirements',
    description:
      'Free 35x45 mm Schengen visa photo maker. Correct 70-80% face height, light background and a printable sheet. Works in your browser — nothing is uploaded.',
  },
  'uk-passport.md': {
    title: 'Free Online UK Passport Photo — 35x45 mm Requirements',
    description:
      'Free 35x45 mm UK passport photo maker. Correct 29-34 mm head height, plain background and a printable sheet. Works in your browser — nothing is uploaded.',
  },
  'us-dv-lottery.md': {
    title: 'Free Online DV Lottery Photo — 600x600 px, Under 240KB',
    description:
      'Free 600x600 px DV lottery photo maker. Correct head and eye position, white background, under the 240KB limit. Works in your browser — nothing is uploaded.',
  },
  'us-passport.md': {
    title: 'Free Online US Passport Photo — 2x2 in Requirements',
    description:
      'Free 2x2 in US passport photo maker. Correct head height, eye line, white background and a printable 4x6 sheet. Works in your browser — nothing is uploaded.',
  },
};

const specPath = (locale: string, name: string): string => `${SPECS_DIR}/${locale}/${name}`;
const specsIn = (locale: string): string[] =>
  readdirSync(`${SPECS_DIR}/${locale}`).filter((name) => name.endsWith('.md'));

/** The frontmatter of one spec, as text, or `null` if it has none. */
function frontmatterOf(text: string): string | null {
  return /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? null;
}

/**
 * One single-line frontmatter field, with any surrounding double quotes from
 * YAML quoting removed, or `undefined` if the field is absent.
 */
function fieldOf(frontmatter: string, field: string): string | undefined {
  const value = new RegExp(`^${field}:[ \\t]*(.+)$`, 'm').exec(frontmatter)?.[1];
  if (value === undefined) return undefined;
  return /^"(.*)"$/.exec(value)?.[1] ?? value;
}

/** Every published spec, as `{ locale, name }` for readable failure messages. */
function publishedSpecs(): { locale: string; name: string }[] {
  return locales.flatMap((locale) =>
    specsIn(locale).flatMap((name) => {
      const frontmatter = frontmatterOf(readFileSync(specPath(locale, name), 'utf8'));
      expect(frontmatter, `${locale}/${name} has no frontmatter`).not.toBeNull();
      const status = /^status:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter ?? '')?.[1];
      return isPublished({ status: status ?? '' }) ? [{ locale, name }] : [];
    }),
  );
}

describe('the frontmatter reader this file depends on', () => {
  // Guards the guard, like the parity suite's: a broken field split would make
  // every length check below read `undefined` and pass in silence.
  it('reads title and description from the reference spec', () => {
    const frontmatter = frontmatterOf(readFileSync(specPath('en-US', 'uk-passport.md'), 'utf8'));
    expect(frontmatter).not.toBeNull();
    expect(fieldOf(frontmatter ?? '', 'title')).toBe(GOLD['uk-passport.md']?.title);
    expect(fieldOf(frontmatter ?? '', 'description')).toBe(GOLD['uk-passport.md']?.description);
  });

  it('finds published specs in every locale', () => {
    // 11 locales, 5 published documents each. Fewer means the loops below are
    // silently covering a shrinking site.
    expect(publishedSpecs().length).toBe(55);
  });
});

describe('a published spec page survives the results page', () => {
  it('keeps every title short enough to avoid truncation', () => {
    for (const { locale, name } of publishedSpecs()) {
      const frontmatter = frontmatterOf(readFileSync(specPath(locale, name), 'utf8'));
      const title = fieldOf(frontmatter ?? '', 'title');
      expect(title, `${locale}/${name} declares no title`).toBeDefined();
      expect(
        title?.length ?? Infinity,
        `${locale}/${name}: title is ${title?.length} characters, over the 60-character ` +
          `snippet limit — shorten it while keeping the size and the free-online hook.`,
      ).toBeLessThanOrEqual(60);
    }
  });

  it('keeps every description inside the usable range', () => {
    for (const { locale, name } of publishedSpecs()) {
      const frontmatter = frontmatterOf(readFileSync(specPath(locale, name), 'utf8'));
      const description = fieldOf(frontmatter ?? '', 'description');
      expect(description, `${locale}/${name} declares no description`).toBeDefined();
      expect(
        description?.length ?? 0,
        `${locale}/${name}: description is ${description?.length} characters; ` +
          `50-170 is the range Google shows rather than cuts.`,
      ).toBeGreaterThanOrEqual(50);
      expect(description?.length ?? 0).toBeLessThanOrEqual(170);
    }
  });

  it('carries the exact pinned English copy', () => {
    for (const [name, gold] of Object.entries(GOLD)) {
      const frontmatter = frontmatterOf(readFileSync(specPath('en-US', name), 'utf8'));
      expect(frontmatter, `en-US/${name} has no frontmatter`).not.toBeNull();
      expect(
        fieldOf(frontmatter ?? '', 'title'),
        `en-US/${name}: title drifted from the pinned copy.`,
      ).toBe(gold.title);
      expect(
        fieldOf(frontmatter ?? '', 'description'),
        `en-US/${name}: description drifted from the pinned copy.`,
      ).toBe(gold.description);
    }
  });

  it('leads every English title and description with the click-through hook', () => {
    // The pattern, not the strings: a future spec added to en-US must start from
    // the same value proposition, not from the pre-fix "Size and Requirements".
    for (const { name } of publishedSpecs().filter(({ locale }) => locale === 'en-US')) {
      const frontmatter = frontmatterOf(readFileSync(specPath('en-US', name), 'utf8'));
      expect(
        fieldOf(frontmatter ?? '', 'title')?.startsWith('Free Online ') ?? false,
        `en-US/${name}: title should lead with "Free Online " — that hook is the ` +
          `whole point of this copy.`,
      ).toBe(true);
      const description = fieldOf(frontmatter ?? '', 'description') ?? '';
      expect(description, `en-US/${name}: description should say it is free.`).toMatch(/free/i);
      expect(
        description,
        `en-US/${name}: description should name the browser privacy promise.`,
      ).toMatch(/browser/i);
    }
  });
});
