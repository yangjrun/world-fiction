import { getCollection, type CollectionEntry } from 'astro:content';
import { toPhotoSpec, type RawPhotoSpec } from './photo/raw-spec.js';
import type { PhotoSpec } from './photo/types.js';

export type SpecEntry = CollectionEntry<'specs'>;

export interface SpecPage {
  readonly entry: SpecEntry;
  readonly spec: PhotoSpec;
  /** URL path, e.g. `/us/passport`. */
  readonly href: string;
}

function toSpecPage(entry: SpecEntry): SpecPage {
  const { country, document } = entry.data;
  return {
    entry,
    // The frontmatter schema mirrors RawPhotoSpec, and toPhotoSpec re-validates
    // the parts Zod cannot check, such as a head taller than the image itself.
    spec: toPhotoSpec(entry.data as unknown as RawPhotoSpec),
    href: `/${country}/${document}`,
  };
}

/**
 * Every spec cleared for publication, sorted by country then document.
 *
 * Entries still marked `needs-review` are excluded: their numbers have not been
 * checked against an official source, and a page built from unverified data would
 * hand users photos that get rejected. Accuracy is the whole product here, so the
 * gate lives in the build rather than in a reviewer's memory.
 */
export async function getVerifiedSpecPages(): Promise<SpecPage[]> {
  const entries = await getCollection('specs', ({ data }) => data.status === 'verified');
  return entries
    .map(toSpecPage)
    .sort((a, b) =>
      a.entry.data.countryName.localeCompare(b.entry.data.countryName) ||
      a.entry.data.documentName.localeCompare(b.entry.data.documentName),
    );
}

/** Specs awaiting verification, for the maintenance view. */
export async function getPendingSpecEntries(): Promise<SpecEntry[]> {
  return getCollection('specs', ({ data }) => data.status !== 'verified');
}
