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
/** Schengen at 600 DPI, where a pixel dimension first reaches four digits. */
const HIGH_DPI: PhotoSpec = {
  ...SCHENGEN_VISA,
  output: { kind: 'physical', widthMm: 35, heightMm: 45, dpi: 600 },
};

/** A 25MB ceiling, where a kilobyte count first reaches five digits. */
const LARGE_CEILING: PhotoSpec = {
  ...DV_LOTTERY,
  file: { format: 'jpeg', maxBytes: 25 * 1024 * 1024 },
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

describe('Spec label number grouping', () => {
  // One formatter cannot serve both: a pixel count and a kilobyte count want
  // opposite answers on the thousands separator, and both reach four digits with
  // ordinary spec data.
  it('writes pixel dimensions and DPI without a thousands separator', async () => {
    // Imaging writes `1920 × 1080`, never `1,920 × 1,080` — and grouped, this
    // locale set would spell that separator three ways (`1,063`, `1.063`,
    // `1 063`) for a number no reader takes as a quantity. The largest spec in
    // the repository today is 827 px; a 600-DPI spec reaches four digits at once.
    const enUS = await labelsFor('en-US');
    expect(enUS.sizeWithPixels(HIGH_DPI)).toBe('35 × 45 mm (827 × 1063 px at 600 DPI)');

    const deDE = await labelsFor('de-DE');
    expect(deDE.sizeWithPixels(HIGH_DPI)).toBe('35 × 45 mm (827 × 1063 px at 600 DPI)');
  });

  it('keeps grouping on a kilobyte ceiling, which is a quantity', async () => {
    // `max 25600 KB` is a worse read than `max 25,600 KB`, and this is the value
    // an authority states as a limit rather than a dimension.
    const enUS = await labelsFor('en-US');
    expect(enUS.file(LARGE_CEILING)).toBe('JPEG, max 25,600 KB');

    const deDE = await labelsFor('de-DE');
    expect(deDE.file(LARGE_CEILING)).toBe('JPEG, max 25.600 KB');
  });
});

describe('Spec label file separator', () => {
  // Intl.ListFormat was the first implementation here and was wrong twice over.
  // `{style: 'short', type: 'unit'}` inserts a conjunction for two items in
  // es-ES, fr-FR, it-IT and pt-PT (`JPEG et max 240 KB`) and for three in de-DE,
  // so the rationale for choosing `unit` over `conjunction` was simply false. And
  // zh-CN's unit-list pattern has no separator at all: `JPEG` and `max 240 KB`
  // come out as `JPEGmax 240 KB`, one fused token, with nothing a translator can
  // do about it. A table cell of independent constraints is not a linguistic
  // list, so the separator is a bundle key.
  it('separates the constraints in every locale, and fuses nothing', async () => {
    for (const locale of locales) {
      const dict = await getTranslations(locale);
      const separator = dict['spec.file-separator'] ?? '';
      const labels = await labelsFor(locale);
      const value = labels.file(DV_LOTTERY);

      // An empty separator is the fused token written by hand — and a
      // whitespace-only one is `JPEG max 240 KB`, where the constraints read as
      // one phrase describing the format rather than as two independent limits.
      // The key's own __note asks for a visible mark, so the check is on the
      // trimmed length: " " has to fail here, not ship unflagged.
      expect(separator.trim().length, `${locale} has a blank separator`).toBeGreaterThan(0);
      // The format name is not translated, so this holds once the bundles are.
      expect(value.startsWith(`JPEG${separator}`), `${locale}: ${value}`).toBe(true);
    }
  });

  it('is exactly what the table always rendered, in the source locale', async () => {
    const dict = await getTranslations('en-US');
    expect(dict['spec.file-separator']).toBe(', ');
  });
});
