import { describe, expect, it } from 'vitest';

import { locales, type Locale } from '@/i18n/config';
import { getTranslations, useTranslations } from '@/i18n/ui';
import type { PhotoSpec } from '@/lib/photo/types';
import { createSpecLabels } from '@/lib/spec-labels';

import { DV_LOTTERY, SCHENGEN_VISA, US_PASSPORT } from '../fixtures.js';

// Every measurement the spec table and the home-page cards print comes from
// `createSpecLabels`. Two things are worth pinning here, and neither is visible
// while reading English output.
//
// The wording, because these strings replaced literals inside two components: the
// en-US assertions below are the exact text those components used to build, so a
// bad translation key or a reordered pattern shows up as a diff rather than as
// prose nobody re-reads.
//
// The numbers, because `50.8` reads as fifty thousand eight hundred to a German,
// Spanish or French reader. That half cannot be fixed by translating, and the
// locale bundles are still English, so nothing else in the suite would notice it.

async function labelsFor(locale: Locale) {
  const t = useTranslations(locale);
  await t.load();
  return createSpecLabels(locale, t.t);
}

/** DV lottery with both bounds, which no spec in the repository has yet. */
const BOUNDED_FILE: PhotoSpec = {
  ...DV_LOTTERY,
  file: { format: 'jpeg', maxBytes: 240 * 1024, minBytes: 10 * 1024 },
};

describe('Spec labels in the source locale', () => {
  it('prints a print size, with the derived pixel size in brackets', async () => {
    const labels = await labelsFor('en-US');
    expect(labels.size(US_PASSPORT)).toBe('50.8 × 50.8 mm');
    expect(labels.sizeWithPixels(US_PASSPORT)).toBe('50.8 × 50.8 mm (600 × 600 px at 300 DPI)');
  });

  it('prints a band in the published millimetres, percentage in brackets', async () => {
    const labels = await labelsFor('en-US');
    expect(labels.headHeight(US_PASSPORT)).toBe('25.4 mm – 34.9 mm (50% – 69% of height)');
    expect(labels.eyeLine(US_PASSPORT)).toBe('28.6 mm – 34.9 mm (56% – 69% of height)');
  });

  it('drops the eye-line row where an authority publishes no rule', async () => {
    const labels = await labelsFor('en-US');
    expect(labels.eyeLine(SCHENGEN_VISA)).toBeNull();
    expect(labels.headHeight(SCHENGEN_VISA)).toBe('32.0 mm – 36.0 mm (71% – 80% of height)');
  });

  it('falls back to percentages for a digital-only spec, which has no print size', async () => {
    const labels = await labelsFor('en-US');
    expect(labels.size(DV_LOTTERY)).toBe('600 × 600 px');
    // Nothing to put in brackets: the pixel count is the requirement itself.
    expect(labels.sizeWithPixels(DV_LOTTERY)).toBe('600 × 600 px');
    expect(labels.headHeight(DV_LOTTERY)).toBe('50% – 69% of height');
  });

  it('lists the file constraints an authority sets, and only those', async () => {
    const labels = await labelsFor('en-US');
    expect(labels.file(US_PASSPORT)).toBe('JPEG');
    expect(labels.file(DV_LOTTERY)).toBe('JPEG, max 240 KB');
    expect(labels.file(BOUNDED_FILE)).toBe('JPEG, max 240 KB, min 10 KB');
  });

  it('captions the table with the document it describes', async () => {
    const labels = await labelsFor('en-US');
    expect(labels.caption(US_PASSPORT)).toBe('US passport photo requirements');
  });
});

describe('Spec labels in a comma-decimal locale', () => {
  const commaLocales = ['de-DE', 'es-ES', 'fr-FR'] as const;

  it('writes a decimal size with a comma', async () => {
    for (const locale of commaLocales) {
      const labels = await labelsFor(locale);
      expect(labels.size(US_PASSPORT), locale).toContain('50,8');
      expect(labels.size(US_PASSPORT), locale).not.toContain('50.8');
    }
  });

  it('carries that separator into every derived number', async () => {
    const labels = await labelsFor('de-DE');
    // The bundle is still English, so only the numbers move — which is the point:
    // translating alone would never have fixed them.
    expect(labels.sizeWithPixels(US_PASSPORT)).toBe('50,8 × 50,8 mm (600 × 600 px at 300 DPI)');
    expect(labels.headHeight(US_PASSPORT)).toContain('25,4 mm – 34,9 mm');
  });

  it('runs on an ICU build that knows these locales', () => {
    // Node compiled with small-icu answers every locale with en-US formatting, so
    // the assertions above would pass by printing English numbers. If this one
    // fails the runtime is at fault, not the code.
    expect(new Intl.NumberFormat('de-DE').format(50.8)).toBe('50,8');
    expect(new Intl.NumberFormat('en-US').format(50.8)).toBe('50.8');
  });
});

describe('Spec label translation keys', () => {
  const keys = [
    'spec.dimensions',
    'spec.size-print',
    'spec.band-length',
    'spec.band-percent',
    'spec.file-max',
    'spec.file-min',
    'spec.caption',
    'unit.mm',
    'unit.px',
    'unit.dpi',
    'unit.kb',
  ];

  it('are present in every locale bundle', async () => {
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      for (const key of keys) {
        expect(dict[key], `${locale} is missing ${key}`).toBeTruthy();
      }
    }
  });

  it('leave no key name or unfilled placeholder in the rendered label', async () => {
    // `t()` returns the key itself when it is missing, and an unknown parameter
    // name leaves its `{brace}` in place. Both render silently into the page.
    const labels = await labelsFor('en-US');
    const rendered = [
      labels.size(US_PASSPORT),
      labels.sizeWithPixels(US_PASSPORT),
      labels.headHeight(US_PASSPORT),
      labels.eyeLine(US_PASSPORT) ?? '',
      labels.file(BOUNDED_FILE),
      labels.caption(US_PASSPORT),
      labels.headHeight(DV_LOTTERY),
    ];

    for (const value of rendered) {
      expect(value).not.toContain('spec.');
      expect(value).not.toContain('unit.');
      expect(value).not.toContain('{');
    }
  });
});
