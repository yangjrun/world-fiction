import type { DocumentId } from './specs-locale';

/**
 * Which spec pages link to each other, declared once in code rather than in
 * frontmatter: these are structural edges between pages, not prose, and a
 * frontmatter field would have to be copied into all eleven locales of every
 * spec (the parity tests compare every non-translatable block, fail-closed)
 * for no benefit.
 *
 * Keyed `${country}/${document}` — both are lowercase slugs per
 * `src/content.config.ts`, so two pairs cannot collide on one key. Edges are
 * declared in both directions so a lookup is a lookup, not a graph walk.
 *
 * Pure and free of `astro:content`, so vitest can load it — the same reason
 * `specs-locale.ts` sits apart from `specs.ts`.
 */
const RELATED: Readonly<Record<string, readonly DocumentId[]>> = {
  // UK and Schengen share the 35x45 mm outer size — the uk prose already
  // cross-references the Schengen format, so the page makes the link real.
  'uk/passport': [{ country: 'schengen', document: 'visa' }],
  'schengen/visa': [{ country: 'uk', document: 'passport' }],
  // The DV lottery photo is the same authority's rules in pixels instead of
  // inches, and Canada's is the other North American passport most readers of
  // the US page are also applying for.
  'us/passport': [
    { country: 'us', document: 'dv-lottery' },
    { country: 'ca', document: 'passport' },
  ],
  'us/dv-lottery': [{ country: 'us', document: 'passport' }],
  'ca/passport': [{ country: 'us', document: 'passport' }],
};

export function relatedDocuments({ country, document }: DocumentId): readonly DocumentId[] {
  return RELATED[`${country}/${document}`] ?? [];
}
