import { describe, expect, it } from 'vitest';
import {
  MM_PER_INCH,
  inchToMm,
  mmToPx,
  mmToPxExact,
  pxToMm,
  resolvePhysicalSize,
  resolvePixelSize,
} from '@/lib/photo/units.js';
import { DV_LOTTERY, SCHENGEN_VISA, US_PASSPORT } from './fixtures.js';

describe('mmToPx', () => {
  it('converts one inch at 300dpi to 300 pixels', () => {
    expect(mmToPx(MM_PER_INCH, 300)).toBe(300);
  });

  it('derives a round 600px from the US 2x2in spec', () => {
    expect(mmToPx(50.8, 300)).toBe(600);
  });

  it('rounds to the nearest whole pixel', () => {
    expect(mmToPx(35, 300)).toBe(413);
    expect(mmToPxExact(35, 300)).toBeCloseTo(413.3858, 4);
  });

  it('rejects a non-positive dpi', () => {
    expect(() => mmToPx(10, 0)).toThrow(RangeError);
    expect(() => mmToPx(10, -300)).toThrow(RangeError);
  });

  it('rejects non-finite input', () => {
    expect(() => mmToPx(Number.NaN, 300)).toThrow(RangeError);
    expect(() => mmToPx(10, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe('pxToMm', () => {
  it('round-trips with mmToPxExact', () => {
    expect(pxToMm(mmToPxExact(45, 600), 600)).toBeCloseTo(45, 9);
  });

  it('rejects a non-positive dpi', () => {
    expect(() => pxToMm(600, 0)).toThrow(RangeError);
  });

  it('rejects non-finite pixels', () => {
    expect(() => pxToMm(Number.NaN, 300)).toThrow(RangeError);
  });
});

describe('inchToMm', () => {
  it('converts inches to millimetres', () => {
    expect(inchToMm(2)).toBeCloseTo(50.8, 9);
  });

  it('rejects non-finite input', () => {
    expect(() => inchToMm(Number.NaN)).toThrow(RangeError);
  });
});

describe('resolvePixelSize', () => {
  it('derives pixels from a physical spec', () => {
    expect(resolvePixelSize(US_PASSPORT.output)).toEqual({ widthPx: 600, heightPx: 600 });
    expect(resolvePixelSize(SCHENGEN_VISA.output)).toEqual({ widthPx: 413, heightPx: 531 });
  });

  it('passes a digital spec through verbatim', () => {
    expect(resolvePixelSize(DV_LOTTERY.output)).toEqual({ widthPx: 600, heightPx: 600 });
  });

  it('rejects a non-positive digital size', () => {
    expect(() => resolvePixelSize({ kind: 'digital', widthPx: 0, heightPx: 600 })).toThrow(RangeError);
  });

  it('rejects a non-positive physical size', () => {
    expect(() => resolvePixelSize({ kind: 'physical', widthMm: -1, heightMm: 45, dpi: 300 })).toThrow(RangeError);
  });
});

describe('resolvePhysicalSize', () => {
  it('returns millimetres and dpi for a physical spec', () => {
    expect(resolvePhysicalSize(SCHENGEN_VISA.output)).toEqual({ widthMm: 35, heightMm: 45, dpi: 300 });
  });

  it('returns null for a digital-only spec, which cannot be printed', () => {
    expect(resolvePhysicalSize(DV_LOTTERY.output)).toBeNull();
  });
});
