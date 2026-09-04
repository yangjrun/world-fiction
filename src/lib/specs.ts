import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/i18n/config';
import { toPhotoSpec, type RawPhotoSpec } from './photo/raw-spec.js';
import type { PhotoSpec } from './photo/types.js';
import { countDistinctDocuments, matchesLocale } from './specs-locale.js';

export type SpecEntry = CollectionEntry<'specs'>;

export interface SpecPage {
  readonly entry: SpecEntry;
  readonly spec: PhotoSpec;
  /** URL path, e.g. `/en-US/us/passport`. */
  readonly href: string;
}

function toSpecPage(entry: SpecEntry, locale: Locale): SpecPage {
  const { country, document } = entry.data;
  return {
    entry,
    // The frontmatter schema mirrors RawPhotoSpec, and toPhotoSpec re-validates
    // the parts Zod cannot check, such as a head taller than the image itself.
    spec: toPhotoSpec(entry.data as unknown as RawPhotoSpec),
    href: `/${locale}/${country}/${document}`,
  };
}

/**
 * Every spec cleared for publication in `locale`, sorted by country then document.
 *
 * Entries still marked `needs-review` are excluded: their numbers have not been
 * checked against an official source, and a page built from unverified data would
 * hand users photos that get rejected. Accuracy is the whole product here, so the
 * gate lives in the build rather than in a reviewer's memory.
 *
 * The locale gate is `matchesLocale`, not a plain comparison against the id's
 * first segment — see `./specs-locale.ts` for why that comparison silently
 * matches nothing.
 */
export async function getVerifiedSpecPages(locale: Locale): Promise<SpecPage[]> {
  const entries = await getCollection(
    'specs',
    ({ id, data }) => matchesLocale(id, locale) && data.status === 'verified',
  );
  return entries
    .map((entry) => toSpecPage(entry, locale))
    .sort((a, b) =>
      a.entry.data.countryName.localeCompare(b.entry.data.countryName) ||
      a.entry.data.documentName.localeCompare(b.entry.data.documentName),
    );
}

/**
 * How many distinct documents the site publishes, in any language.
 *
 * Deliberately not per locale, and deliberately not a count of entries: see
 * `countDistinctDocuments` in ./specs-locale.ts for what each of those two
 * readings gets wrong about the sentence on the about page.
 */
export async function getVerifiedDocumentCount(): Promise<number> {
  const entries = await getCollection('specs', ({ data }) => data.status === 'verified');
  return countDistinctDocuments(entries.map(({ data }) => data));
}

/** Specs awaiting verification, in every locale, for the maintenance view. */
export async function getPendingSpecEntries(): Promise<SpecEntry[]> {
  return getCollection('specs', ({ data }) => data.status !== 'verified');
}
