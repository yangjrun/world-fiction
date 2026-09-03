import { resolvePhysicalSize } from './units.js';
import type { BackgroundRule, FileRule, HeadHeightRule, OutputSize, PhotoSpec } from './types.js';

/**
 * The shape spec data is authored in.
 *
 * Authorities publish head height and eye line in millimetres, so that is what
 * the Markdown frontmatter carries: a reviewer can hold the file next to the
 * official page and compare numbers directly, with no arithmetic in between.
 * Converting to the ratios the geometry layer wants happens here, once, under test.
 *
 * The Zod schema in `src/content.config.ts` mirrors this interface. Keep them in step.
 */
export type RawHeadHeight =
  | { readonly minMm: number; readonly maxMm: number }
  | { readonly minRatio: number; readonly maxRatio: number };

export type RawEyeLine =
  | { readonly minMmFromBottom: number; readonly maxMmFromBottom: number }
  | { readonly minRatio: number; readonly maxRatio: number };

export interface RawPhotoSpec {
  readonly country: string;
  readonly countryName: string;
  readonly document: string;
  readonly documentName: string;
  readonly output: OutputSize;
  readonly headHeight: RawHeadHeight;
  readonly eyeLine?: RawEyeLine;
  readonly background: BackgroundRule;
  readonly file: FileRule;
  readonly sourceUrl: string;
}

function physicalHeightMm(output: OutputSize, context: string): number {
  const physical = resolvePhysicalSize(output);
  if (!physical) {
    throw new TypeError(
      `${context}: millimetre measurements need a physical output size, but this spec is digital-only. ` +
        'Express the rule as minRatio/maxRatio instead.',
    );
  }
  return physical.heightMm;
}

function assertBand(min: number, max: number, context: string): void {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError(`${context}: bounds must be finite`);
  }
  if (min <= 0 || min > max) {
    throw new RangeError(`${context}: bounds must satisfy 0 < min <= max, received ${min}..${max}`);
  }
}

function normaliseHeadHeight(raw: RawHeadHeight, output: OutputSize, context: string): HeadHeightRule {
  if ('minRatio' in raw) {
    assertBand(raw.minRatio, raw.maxRatio, `${context} headHeight`);
    if (raw.maxRatio > 1) throw new RangeError(`${context} headHeight: maxRatio cannot exceed 1`);
    return { minRatio: raw.minRatio, maxRatio: raw.maxRatio };
  }
  assertBand(raw.minMm, raw.maxMm, `${context} headHeight`);
  const heightMm = physicalHeightMm(output, `${context} headHeight`);
  if (raw.maxMm > heightMm) {
    throw new RangeError(`${context} headHeight: maxMm ${raw.maxMm} exceeds the ${heightMm}mm image height`);
  }
  return { minRatio: raw.minMm / heightMm, maxRatio: raw.maxMm / heightMm };
}

function normaliseEyeLine(raw: RawEyeLine, output: OutputSize, context: string) {
  if ('minRatio' in raw) {
    assertBand(raw.minRatio, raw.maxRatio, `${context} eyeLine`);
    if (raw.maxRatio > 1) throw new RangeError(`${context} eyeLine: maxRatio cannot exceed 1`);
    return { minRatio: raw.minRatio, maxRatio: raw.maxRatio };
  }
  assertBand(raw.minMmFromBottom, raw.maxMmFromBottom, `${context} eyeLine`);
  const heightMm = physicalHeightMm(output, `${context} eyeLine`);
  if (raw.maxMmFromBottom > heightMm) {
    throw new RangeError(
      `${context} eyeLine: maxMmFromBottom ${raw.maxMmFromBottom} exceeds the ${heightMm}mm image height`,
    );
  }
  return { minRatio: raw.minMmFromBottom / heightMm, maxRatio: raw.maxMmFromBottom / heightMm };
}

/** Build the spec id used in URLs and analytics from its country and document slugs. */
export function specId(country: string, document: string): string {
  return `${country}-${document}`;
}

/**
 * Convert authored spec data into the normalised {@link PhotoSpec} the pipeline uses.
 *
 * Throws on contradictory data rather than coercing it: a spec with a bad head
 * range would otherwise ship a page that confidently produces rejected photos.
 */
export function toPhotoSpec(raw: RawPhotoSpec): PhotoSpec {
  const id = specId(raw.country, raw.document);
  if (raw.background.colors.length === 0) {
    throw new RangeError(`${id} background: at least one allowed colour is required`);
  }
  return {
    id,
    country: raw.country,
    countryName: raw.countryName,
    document: raw.document,
    documentName: raw.documentName,
    output: raw.output,
    headHeight: normaliseHeadHeight(raw.headHeight, raw.output, id),
    ...(raw.eyeLine ? { eyeLine: normaliseEyeLine(raw.eyeLine, raw.output, id) } : {}),
    background: raw.background,
    file: raw.file,
    sourceUrl: raw.sourceUrl,
  };
}
