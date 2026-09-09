import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { defaultLocale } from '@/i18n/config';
import { isPublished } from '@/lib/specs-locale';
import { relatedDocuments } from '@/lib/related-specs';

/**
 * The related-specs graph is a structural promise: every published English
 * page links to at least one other, every link points at a page the build
 * actually writes, and the edges are honest in both directions. A page linking
 * to itself, or an edge declared one way, is invisible in the rendered HTML —
 * the section renders, the anchor points somewhere that exists — so the graph
 * itself is the thing under test, read the same way the parity suite reads
 * specs: from the files, fail-closed.
 */
const SPECS_DIR = fileURLToPath(new URL('../src/content/specs', import.meta.url));

const frontmatterOf = (text: string): string | null =>
  /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? null;

interface SpecId {
  readonly country: string;
  readonly document: string;
}

/** The published en-US specs, as `{ country, document }` pairs. */
function publishedEnUsSpecs(): SpecId[] {
  return readdirSync(`${SPECS_DIR}/${defaultLocale}`)
    .filter((name) => name.endsWith('.md'))
    .flatMap((name) => {
      const frontmatter = frontmatterOf(
        readFileSync(`${SPECS_DIR}/${defaultLocale}/${name}`, 'utf8'),
      );
      expect(frontmatter, `${defaultLocale}/${name} has no frontmatter`).not.toBeNull();
      const status = /^status:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter ?? '')?.[1];
      if (!isPublished({ status: status ?? '' })) return [];

      const country = /^country:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter ?? '')?.[1];
      const document = /^document:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter ?? '')?.[1];
      expect(country, `${defaultLocale}/${name} declares no country`).toBeDefined();
      expect(document, `${defaultLocale}/${name} declares no document`).toBeDefined();
      return [{ country: country ?? '', document: document ?? '' }];
    });
}

/** The file name a published spec's slugs map to, e.g. `uk-passport.md`. */
const fileNameOf = (id: SpecId): string => `${id.country}-${id.document}.md`;

describe('the reader this file depends on', () => {
  it('finds the five published English specs', () => {
    expect(publishedEnUsSpecs().length).toBe(5);
  });
});

describe('the related-specs graph', () => {
  it('links every published English spec to at least one other page', () => {
    for (const id of publishedEnUsSpecs()) {
      expect(
        relatedDocuments(id).length,
        `${id.country}/${id.document} links nowhere, so its page never renders ` +
          `the related section — add at least one edge.`,
      ).toBeGreaterThan(0);
    }
  });

  it('links only to published English specs', () => {
    for (const id of publishedEnUsSpecs()) {
      for (const target of relatedDocuments(id)) {
        const path = `${SPECS_DIR}/${defaultLocale}/${fileNameOf(target)}`;
        const text = readFileSync(path, 'utf8');
        const frontmatter = frontmatterOf(text);
        expect(frontmatter, `${defaultLocale}/${fileNameOf(target)} has no frontmatter`).not.toBeNull();

        const status = /^status:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter ?? '')?.[1];
        expect(
          isPublished({ status: status ?? '' }),
          `${id.country}/${id.document} links to ${target.country}/${target.document}, ` +
            `which is not published — a link to a page the build never writes.`,
        ).toBe(true);

        const country = /^country:[ \t]*(\S+)[ \t]*$/m.exec(frontmatter ?? '')?.[1];
        expect(
          country,
          `${id.country}/${id.document} links to "${target.country}/${target.document}" ` +
            `but the file at ${fileNameOf(target)} declares country "${country}".`,
        ).toBe(target.country);
      }
    }
  });

  it('declares every edge in both directions', () => {
    for (const id of publishedEnUsSpecs()) {
      for (const target of relatedDocuments(id)) {
        expect(
          relatedDocuments(target),
          `${id.country}/${id.document} links to ${target.country}/${target.document}, ` +
            `but the edge back is missing.`,
        ).toContainEqual(id);
      }
    }
  });

  it('never links a page to itself', () => {
    for (const id of publishedEnUsSpecs()) {
      expect(relatedDocuments(id)).not.toContainEqual(id);
    }
  });
});
