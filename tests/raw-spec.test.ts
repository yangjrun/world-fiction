import { describe, expect, it } from 'vitest';
import { specId, toPhotoSpec, type RawPhotoSpec } from '@/lib/photo/raw-spec.js';

const PHYSICAL: RawPhotoSpec = {
  country: 'us',
  countryName: 'United States',
  document: 'passport',
  documentName: 'US passport photo',
  output: { kind: 'physical', widthMm: 50.8, heightMm: 50.8, dpi: 300 },
  headHeight: { minMm: 25.4, maxMm: 34.925 },
  eyeLine: { minMmFromBottom: 28.575, maxMmFromBottom: 34.925 },
  background: { description: 'Plain white', colors: ['#ffffff'] },
  file: { format: 'jpeg' },
  sourceUrl: 'https://travel.state.gov/',
};

const DIGITAL: RawPhotoSpec = {
  country: 'us',
  countryName: 'United States',
  document: 'dv-lottery',
  documentName: 'DV lottery photo',
  output: { kind: 'digital', widthPx: 600, heightPx: 600 },
  headHeight: { minRatio: 0.5, maxRatio: 0.69 },
  background: { description: 'Plain white', colors: ['#ffffff'] },
  file: { format: 'jpeg', maxBytes: 240 * 1024 },
  sourceUrl: 'https://dvprogram.state.gov/',
};

describe('specId', () => {
  it('joins the country and document slugs', () => {
    expect(specId('us', 'passport')).toBe('us-passport');
  });
});

describe('toPhotoSpec with millimetre measurements', () => {
  const spec = toPhotoSpec(PHYSICAL);

  it('divides head millimetres by the image height to get ratios', () => {
    expect(spec.headHeight.minRatio).toBeCloseTo(0.5, 9);
    expect(spec.headHeight.maxRatio).toBeCloseTo(0.6875, 9);
  });

  it('converts the eye line measured from the bottom edge', () => {
    expect(spec.eyeLine?.minRatio).toBeCloseTo(0.5625, 9);
    expect(spec.eyeLine?.maxRatio).toBeCloseTo(0.6875, 9);
  });

  it('carries the identifying and trust fields through', () => {
    expect(spec.id).toBe('us-passport');
    expect(spec.countryName).toBe('United States');
    expect(spec.sourceUrl).toBe('https://travel.state.gov/');
  });
});

describe('toPhotoSpec with ratio measurements', () => {
  it('passes ratios through untouched', () => {
    const spec = toPhotoSpec(DIGITAL);
    expect(spec.headHeight).toEqual({ minRatio: 0.5, maxRatio: 0.69 });
  });

  it('omits eyeLine entirely when the spec has no such rule', () => {
    const spec = toPhotoSpec(DIGITAL);
    expect('eyeLine' in spec).toBe(false);
  });
});

describe('toPhotoSpec data validation', () => {
  it('refuses millimetre head measurements on a digital-only spec', () => {
    expect(() => toPhotoSpec({ ...DIGITAL, headHeight: { minMm: 20, maxMm: 30 } })).toThrow(/digital-only/);
  });

  it('refuses millimetre eye measurements on a digital-only spec', () => {
    expect(() =>
      toPhotoSpec({ ...DIGITAL, eyeLine: { minMmFromBottom: 20, maxMmFromBottom: 30 } }),
    ).toThrow(/digital-only/);
  });

  it('refuses a head taller than the image', () => {
    expect(() => toPhotoSpec({ ...PHYSICAL, headHeight: { minMm: 25.4, maxMm: 60 } })).toThrow(/exceeds/);
  });

  it('refuses an eye line above the top of the image', () => {
    expect(() =>
      toPhotoSpec({ ...PHYSICAL, eyeLine: { minMmFromBottom: 10, maxMmFromBottom: 60 } }),
    ).toThrow(/exceeds/);
  });

  it('refuses an inverted band', () => {
    expect(() => toPhotoSpec({ ...PHYSICAL, headHeight: { minMm: 40, maxMm: 20 } })).toThrow(RangeError);
  });

  it('refuses a non-positive lower bound', () => {
    expect(() => toPhotoSpec({ ...PHYSICAL, headHeight: { minMm: 0, maxMm: 20 } })).toThrow(RangeError);
  });

  it('refuses a ratio above 1', () => {
    expect(() => toPhotoSpec({ ...DIGITAL, headHeight: { minRatio: 0.5, maxRatio: 1.2 } })).toThrow(RangeError);
    expect(() => toPhotoSpec({ ...DIGITAL, eyeLine: { minRatio: 0.5, maxRatio: 1.2 } })).toThrow(RangeError);
  });

  it('refuses a non-finite bound', () => {
    expect(() => toPhotoSpec({ ...PHYSICAL, headHeight: { minMm: Number.NaN, maxMm: 30 } })).toThrow(RangeError);
  });

  it('refuses a spec with no allowed background colour', () => {
    expect(() => toPhotoSpec({ ...PHYSICAL, background: { description: 'none', colors: [] } })).toThrow(RangeError);
  });
});
