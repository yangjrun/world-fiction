/**
 * Every measurement a spec renders as text, formatted for one locale.
 *
 * A module rather than a helper inside each page, for two reasons.
 *
 * Numbers. A US passport photo is `50.8 × 50.8 mm` in English and
 * `50,8 × 50,8 mm` in German, Spanish and French, where `50.8` reads as fifty
 * thousand eight hundred. `Intl.NumberFormat` owns that decision, per locale, for
 * every number these labels print: print sizes, pixel counts, DPI, percentages
 * and kilobytes.
 *
 * Agreement. The size on a home-page card and the size row of the spec table are
 * the same fact printed twice, from two files. Deriving both here means they
 * cannot drift — not in wording, and not in how a number is punctuated.
 *
 * Unit names, and every pattern that positions them, come from the translation
 * bundle rather than from literals here: `mm` and `KB` are words a translator may
 * want to write differently, and the order of a range is not the English order
 * everywhere. The patterns are translated whole instead of assembled from
 * fragments, so `56% – 69% of height` can become a sentence that puts the
 * percentages inside the phrase — Japanese does — rather than three pieces that
 * only fit together in one order.
 */

import type { Locale } from '@/i18n/config';

import type { EyeLineRule, FileRule, HeadHeightRule, PhotoSpec } from './photo/types.js';
import { resolvePhysicalSize, resolvePixelSize } from './photo/units.js';

/** The `t` returned by `useTranslations(locale)`, narrowed to what this needs. */
export type Translate = (key: string, params?: Record<string, string>) => string;

const BYTES_PER_KB = 1024;

export interface SpecLabels {
  /** `50.8 × 50.8 mm`, or the pixel size of a digital-only spec. */
  readonly size: (spec: PhotoSpec) => string;
  /** `50.8 × 50.8 mm (600 × 600 px at 300 DPI)`. */
  readonly sizeWithPixels: (spec: PhotoSpec) => string;
  /** `25.4 mm – 34.9 mm (50% – 69% of height)`. */
  readonly headHeight: (spec: PhotoSpec) => string;
  /** The same band for the eye line, or `null` where an authority sets none. */
  readonly eyeLine: (spec: PhotoSpec) => string | null;
  /** `JPEG, max 240 KB`. */
  readonly file: (spec: PhotoSpec) => string;
  /** The spec table's screen-reader caption. */
  readonly caption: (spec: PhotoSpec) => string;
}

export function createSpecLabels(locale: Locale, translate: Translate): SpecLabels {
  const number = new Intl.NumberFormat(locale);
  // Exactly one decimal for a derived millimetre band: the ratios come from the
  // published millimetres, so 0.6875 of a 50.8mm photo has to print as the
  // 34.9mm an authority would recognise rather than as 34.925.
  const length = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  // `short` + `unit` is a plain comma-separated list in English — what the file
  // row has always been — and CLDR's own separator elsewhere, which for Chinese
  // is no separator at all. `conjunction` would add an "and" that does not belong
  // in a list of constraints.
  const list = new Intl.ListFormat(locale, { style: 'short', type: 'unit' });

  const dimensions = (width: number, height: number, unit: string): string =>
    translate('spec.dimensions', {
      width: number.format(width),
      height: number.format(height),
      unit,
    });

  function size(spec: PhotoSpec): string {
    const physical = resolvePhysicalSize(spec.output);
    if (physical) return dimensions(physical.widthMm, physical.heightMm, translate('unit.mm'));
    const { widthPx, heightPx } = resolvePixelSize(spec.output);
    return dimensions(widthPx, heightPx, translate('unit.px'));
  }

  function sizeWithPixels(spec: PhotoSpec): string {
    const physical = resolvePhysicalSize(spec.output);
    // A digital-only spec has no print size, so there is nothing to put in
    // brackets: the pixel count is the requirement, not a derived figure.
    if (!physical) return size(spec);
    const { widthPx, heightPx } = resolvePixelSize(spec.output);
    return translate('spec.size-print', {
      physical: dimensions(physical.widthMm, physical.heightMm, translate('unit.mm')),
      pixels: dimensions(widthPx, heightPx, translate('unit.px')),
      dpi: number.format(physical.dpi),
      dpiUnit: translate('unit.dpi'),
    });
  }

  /** The authority's own units first, with the derived percentage in brackets. */
  function band(rule: HeadHeightRule | EyeLineRule, spec: PhotoSpec): string {
    const minPercent = percent.format(rule.minRatio);
    const maxPercent = percent.format(rule.maxRatio);
    const physical = resolvePhysicalSize(spec.output);
    if (!physical) return translate('spec.band-percent', { minPercent, maxPercent });
    return translate('spec.band-length', {
      minLength: length.format(rule.minRatio * physical.heightMm),
      maxLength: length.format(rule.maxRatio * physical.heightMm),
      unit: translate('unit.mm'),
      minPercent,
      maxPercent,
    });
  }

  function file(rule: FileRule): string {
    const unit = translate('unit.kb');
    const kilobytes = (bytes: number): string =>
      number.format(Math.round(bytes / BYTES_PER_KB));
    const parts = [
      rule.format.toUpperCase(),
      rule.maxBytes === undefined
        ? null
        : translate('spec.file-max', { size: kilobytes(rule.maxBytes), unit }),
      rule.minBytes === undefined
        ? null
        : translate('spec.file-min', { size: kilobytes(rule.minBytes), unit }),
    ].filter((part): part is string => part !== null);
    return list.format(parts);
  }

  return {
    size,
    sizeWithPixels,
    headHeight: (spec) => band(spec.headHeight, spec),
    eyeLine: (spec) => (spec.eyeLine ? band(spec.eyeLine, spec) : null),
    file: (spec) => file(spec.file),
    caption: (spec) => translate('spec.caption', { documentName: spec.documentName }),
  };
}
