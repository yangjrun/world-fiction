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
 * only fit together in one order. The separator between file constraints is a
 * bundle key for the same reason, and because CLDR list formatting turned out not
 * to be a separator at all: see `file` below.
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
  // Grouping belongs on a file size — a 25MB ceiling reads `25,600 KB` — and is
  // harmless on a print size, which never reaches four digits.
  const quantity = new Intl.NumberFormat(locale);
  // Pixel dimensions and DPI are written without grouping wherever images are
  // discussed: `1920 × 1080`, never `1,920 × 1,080`. Grouped, this locale set
  // would also spell that separator three ways — `1,063`, `1.063`, `1 063` — for
  // a number no reader takes as a quantity.
  const resolution = new Intl.NumberFormat(locale, { useGrouping: false });
  // Exactly one decimal for a derived millimetre band: the ratios come from the
  // published millimetres, so 0.6875 of a 50.8mm photo has to print as the
  // 34.9mm an authority would recognise rather than as 34.925.
  const length = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });

  const dimensions = (
    format: Intl.NumberFormat,
    width: number,
    height: number,
    unit: string,
  ): string =>
    translate('spec.dimensions', {
      width: format.format(width),
      height: format.format(height),
      unit,
    });

  const printSize = (widthMm: number, heightMm: number): string =>
    dimensions(quantity, widthMm, heightMm, translate('unit.mm'));

  const pixelSize = (widthPx: number, heightPx: number): string =>
    dimensions(resolution, widthPx, heightPx, translate('unit.px'));

  function size(spec: PhotoSpec): string {
    const physical = resolvePhysicalSize(spec.output);
    if (physical) return printSize(physical.widthMm, physical.heightMm);
    const { widthPx, heightPx } = resolvePixelSize(spec.output);
    return pixelSize(widthPx, heightPx);
  }

  function sizeWithPixels(spec: PhotoSpec): string {
    const physical = resolvePhysicalSize(spec.output);
    // A digital-only spec has no print size, so there is nothing to put in
    // brackets: the pixel count is the requirement, not a derived figure.
    if (!physical) return size(spec);
    const { widthPx, heightPx } = resolvePixelSize(spec.output);
    return translate('spec.size-print', {
      physical: printSize(physical.widthMm, physical.heightMm),
      pixels: pixelSize(widthPx, heightPx),
      dpi: resolution.format(physical.dpi),
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
      quantity.format(Math.round(bytes / BYTES_PER_KB));
    const parts = [
      rule.format.toUpperCase(),
      rule.maxBytes === undefined
        ? null
        : translate('spec.file-max', { size: kilobytes(rule.maxBytes), unit }),
      rule.minBytes === undefined
        ? null
        : translate('spec.file-min', { size: kilobytes(rule.minBytes), unit }),
    ].filter((part): part is string => part !== null);
    // A table cell of independent constraints is not a linguistic list, so the
    // separator comes from the bundle rather than from Intl.ListFormat. CLDR's
    // unit-list patterns are not separator-only: on full-ICU Node they insert a
    // conjunction for two items in es-ES, fr-FR, it-IT and pt-PT (`JPEG et max
    // 240 KB`) and for three in de-DE, and zh-CN's pattern has no separator at
    // all, fusing `JPEG` and `max 240 KB` into `JPEGmax 240 KB` — one token, and
    // nothing a translator can do about it.
    return parts.join(translate('spec.file-separator'));
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
