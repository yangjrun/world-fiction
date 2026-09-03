import { describe, expect, it } from 'vitest';
import { planCrop, targetEyeRatioFromBottom, targetHeadRatio } from '@/lib/photo/geometry.js';
import type { FaceMetrics, PhotoSpec } from '@/lib/photo/types.js';
import { DV_LOTTERY, SCHENGEN_VISA, US_PASSPORT } from './fixtures.js';

const US_FACE: FaceMetrics = { crownY: 100, chinY: 300, eyeY: 220, faceCentreX: 400 };
const US_SOURCE = { width: 800, height: 600 };

function planOrThrow(face: FaceMetrics, spec: PhotoSpec, source: { width: number; height: number }) {
  const result = planCrop(face, spec, source);
  if (!result.ok) throw new Error(`expected a successful plan, got ${result.reason}`);
  return result.plan;
}

describe('targetHeadRatio', () => {
  it('aims at the midpoint of the allowed band for maximum tolerance', () => {
    expect(targetHeadRatio(US_PASSPORT)).toBeCloseTo(0.59375, 9);
    expect(targetHeadRatio(SCHENGEN_VISA)).toBeCloseTo(34 / 45, 9);
  });

  it('rejects an inverted band', () => {
    expect(() => targetHeadRatio({ ...US_PASSPORT, headHeight: { minRatio: 0.8, maxRatio: 0.5 } })).toThrow(RangeError);
  });

  it('rejects a band outside 0..1', () => {
    expect(() => targetHeadRatio({ ...US_PASSPORT, headHeight: { minRatio: 0.5, maxRatio: 1.4 } })).toThrow(RangeError);
    expect(() => targetHeadRatio({ ...US_PASSPORT, headHeight: { minRatio: 0, maxRatio: 0.6 } })).toThrow(RangeError);
  });
});

describe('targetEyeRatioFromBottom', () => {
  it('returns the midpoint when the spec constrains the eye line', () => {
    expect(targetEyeRatioFromBottom(US_PASSPORT)).toBeCloseTo(0.625, 9);
  });

  it('returns null when the spec has no eye-line rule', () => {
    expect(targetEyeRatioFromBottom(SCHENGEN_VISA)).toBeNull();
  });
});

describe('planCrop with an eye-line rule', () => {
  const plan = planOrThrow(US_FACE, US_PASSPORT, US_SOURCE);

  it('scales so the head fills the target share of the frame', () => {
    expect(plan.scale).toBeCloseTo(1.78125, 9);
    expect(plan.achievedHeadRatio).toBeCloseTo(0.59375, 9);
  });

  it('places the eye line at the target height above the bottom edge', () => {
    expect(plan.achievedEyeRatioFromBottom).toBeCloseTo(0.625, 9);
  });

  it('produces a square crop for a square spec, centred on the face midline', () => {
    expect(plan.rect.width).toBeCloseTo(plan.rect.height, 9);
    expect(plan.rect.x + plan.rect.width / 2).toBeCloseTo(US_FACE.faceCentreX, 9);
    expect(plan.rect.width).toBeCloseTo(336.8421052631579, 6);
    expect(plan.rect.x).toBeCloseTo(231.5789473684211, 6);
    expect(plan.rect.y).toBeCloseTo(93.68421052631578, 6);
  });

  it('reports the spec output size in pixels', () => {
    expect(plan.outputWidthPx).toBe(600);
    expect(plan.outputHeightPx).toBe(600);
  });
});

describe('planCrop without an eye-line rule', () => {
  const face: FaceMetrics = { crownY: 200, chinY: 600, eyeY: 340, faceCentreX: 500 };
  const plan = planOrThrow(face, SCHENGEN_VISA, { width: 1200, height: 1600 });

  it('still hits the target head ratio', () => {
    expect(plan.achievedHeadRatio).toBeCloseTo(34 / 45, 9);
  });

  it('splits the leftover height so a third of it sits above the crown', () => {
    const crownFromTopRatio = (face.crownY - plan.rect.y) / plan.rect.height;
    expect(crownFromTopRatio).toBeCloseTo((1 - 34 / 45) / 3, 9);
  });

  it('matches the spec aspect ratio', () => {
    expect(plan.rect.width / plan.rect.height).toBeCloseTo(413 / 531, 6);
  });
});

describe('planCrop with a digital-only spec', () => {
  it('uses the declared pixel size directly', () => {
    const plan = planOrThrow({ crownY: 150, chinY: 450, eyeY: 260, faceCentreX: 400 }, DV_LOTTERY, {
      width: 900,
      height: 900,
    });
    expect(plan.outputWidthPx).toBe(600);
    expect(plan.achievedHeadRatio).toBeCloseTo(0.595, 9);
  });
});

describe('planCrop when the source lacks margin', () => {
  const result = planCrop({ crownY: 5, chinY: 105, eyeY: 45, faceCentreX: 50 }, US_PASSPORT, {
    width: 200,
    height: 200,
  });

  it('refuses rather than clamping, since clamping would break compliance', () => {
    expect(result.ok).toBe(false);
    if (result.ok || result.reason !== 'insufficient-margin') throw new Error('expected insufficient-margin');
    expect(result.overflow.top).toBeCloseTo(18.157894736842103, 6);
    expect(result.overflow.left).toBeCloseTo(34.21052631578948, 6);
    expect(result.overflow.bottom).toBe(0);
    expect(result.overflow.right).toBe(0);
  });

  it('still returns the ideal plan so the UI can show what is missing', () => {
    if (result.ok || result.reason !== 'insufficient-margin') throw new Error('expected insufficient-margin');
    expect(result.plan.achievedHeadRatio).toBeCloseTo(0.59375, 9);
  });
});

describe('planCrop input validation', () => {
  const cases: ReadonlyArray<readonly [string, FaceMetrics]> = [
    ['chin above crown', { crownY: 300, chinY: 100, eyeY: 200, faceCentreX: 400 }],
    ['chin equal to crown', { crownY: 100, chinY: 100, eyeY: 100, faceCentreX: 400 }],
    ['eyes above the crown', { crownY: 100, chinY: 300, eyeY: 50, faceCentreX: 400 }],
    ['eyes below the chin', { crownY: 100, chinY: 300, eyeY: 350, faceCentreX: 400 }],
    ['a NaN coordinate', { crownY: Number.NaN, chinY: 300, eyeY: 200, faceCentreX: 400 }],
  ];

  for (const [label, face] of cases) {
    it(`rejects ${label}`, () => {
      const result = planCrop(face, US_PASSPORT, US_SOURCE);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('unreachable');
      expect(result.reason).toBe('invalid-face-metrics');
    });
  }

  it('rejects a non-positive source size', () => {
    const result = planCrop(US_FACE, US_PASSPORT, { width: 0, height: 600 });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.reason).toBe('invalid-face-metrics');
  });
});
