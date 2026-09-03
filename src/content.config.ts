import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

/**
 * Head height and eye line accept either millimetres (what authorities publish,
 * so the file can be diffed against the official page) or a ratio of the image
 * height (for digital-only specs that have no physical size).
 *
 * `src/lib/photo/raw-spec.ts` mirrors these shapes and does the conversion.
 */
const headHeight = z.union([
  z.object({ minMm: z.number().positive(), maxMm: z.number().positive() }),
  z.object({ minRatio: z.number().positive().max(1), maxRatio: z.number().positive().max(1) }),
]);

const eyeLine = z.union([
  z.object({ minMmFromBottom: z.number().positive(), maxMmFromBottom: z.number().positive() }),
  z.object({ minRatio: z.number().positive().max(1), maxRatio: z.number().positive().max(1) }),
]);

const output = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('physical'),
    widthMm: z.number().positive(),
    heightMm: z.number().positive(),
    dpi: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal('digital'),
    widthPx: z.number().int().positive(),
    heightPx: z.number().int().positive(),
  }),
]);

const specs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/specs' }),
  schema: z.object({
    country: z.string().regex(/^[a-z0-9-]+$/, 'country must be a lowercase slug'),
    countryName: z.string().min(1),
    document: z.string().regex(/^[a-z0-9-]+$/, 'document must be a lowercase slug'),
    documentName: z.string().min(1),

    /** Page <title>. Keep under 60 characters so it is not truncated in results. */
    title: z.string().min(1).max(70),
    /** Meta description. 140-160 characters is the usable range. */
    description: z.string().min(50).max(170),

    output,
    headHeight,
    eyeLine: eyeLine.optional(),
    background: z.object({
      description: z.string().min(1),
      colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).min(1),
    }),
    file: z.object({
      format: z.enum(['jpeg', 'png']),
      maxBytes: z.number().int().positive().optional(),
      minBytes: z.number().int().positive().optional(),
    }),

    /**
     * Official source for every number above, and the date a human last read it.
     * Requirements change; a stale date is the signal to re-check.
     */
    sourceUrl: z.url(),
    sourceCheckedOn: z.coerce.date(),

    /**
     * Only `verified` specs get a published page. Anything else is data a human
     * has not yet checked against `sourceUrl`, and shipping it would mean handing
     * users photos that get rejected at the counter.
     */
    status: z.enum(['verified', 'needs-review']),

    /** Why applications get bounced. Genuinely useful, and it carries the page. */
    rejectionReasons: z.array(z.string().min(1)).default([]),
    faq: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).default([]),
  }),
});

export const collections = { specs };
