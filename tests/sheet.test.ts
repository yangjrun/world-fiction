import { describe, expect, it } from 'vitest';
import { SHEET_6X4_IN, SHEET_A4, planPrintSheet } from '@/lib/photo/sheet.js';

const US_PHOTO = { widthMm: 50.8, heightMm: 50.8 };
const SCHENGEN_PHOTO = { widthMm: 35, heightMm: 45 };

describe('planPrintSheet on a 6x4in print', () => {
  it('fits exactly six 2x2in photos, the borderless 3x2 grid print shops use', () => {
    const plan = planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 300 });
    expect(plan.columns).toBe(3);
    expect(plan.rows).toBe(2);
    expect(plan.count).toBe(6);
    expect(plan.rotatedQuarterTurn).toBe(false);
    expect(plan.cells).toHaveLength(6);
  });

  it('fills the sheet edge to edge for the 2x2in case', () => {
    const plan = planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 300 });
    expect(plan.sheetWidthPx).toBe(1800);
    expect(plan.sheetHeightPx).toBe(1200);
    expect(plan.cells[0]).toEqual({ x: 0, y: 0, width: 600, height: 600 });
    expect(plan.cells[5]).toEqual({ x: 1200, y: 600, width: 600, height: 600 });
  });

  it('fits eight 35x45mm photos and centres the block', () => {
    const plan = planPrintSheet(SCHENGEN_PHOTO, { ...SHEET_6X4_IN, dpi: 300 });
    expect(plan.count).toBe(8);
    expect(plan.columns).toBe(4);
    expect(plan.rows).toBe(2);
    expect(plan.cells[0]).toEqual({ x: 74, y: 69, width: 413, height: 531 });
  });

  it('returns an empty layout when the photo cannot fit at all', () => {
    const plan = planPrintSheet({ widthMm: 300, heightMm: 300 }, { ...SHEET_6X4_IN, dpi: 300 });
    expect(plan.count).toBe(0);
    expect(plan.cells).toEqual([]);
  });
});

describe('planPrintSheet orientation choice', () => {
  it('turns the photo a quarter turn when that fits more per sheet', () => {
    const plan = planPrintSheet({ widthMm: 90, heightMm: 60 }, { ...SHEET_A4, dpi: 300 });
    expect(plan.rotatedQuarterTurn).toBe(true);
    expect(plan.columns).toBe(3);
    expect(plan.rows).toBe(3);
    expect(plan.count).toBe(9);
  });

  it('prefers the unrotated layout when both orientations tie', () => {
    const plan = planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 300 });
    expect(plan.rotatedQuarterTurn).toBe(false);
  });
});

describe('planPrintSheet gutters and margins', () => {
  it('loses a column once a gutter eats the last of the slack', () => {
    const withGutter = planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 300, gutterMm: 1 });
    expect(withGutter.columns).toBe(2);
  });

  it('honours a margin by shrinking the usable area', () => {
    const plan = planPrintSheet(SCHENGEN_PHOTO, { ...SHEET_6X4_IN, dpi: 300, marginMm: 10 });
    // A 10mm border drops the borderless 4x2 down to 2x2, and once the sheet is
    // that tight the quarter-turned layout is the denser of the two.
    expect(plan.rotatedQuarterTurn).toBe(true);
    expect(plan.columns).toBe(2);
    expect(plan.rows).toBe(2);
    expect(plan.count).toBe(4);
  });
});

describe('planPrintSheet validation', () => {
  it('rejects a non-positive dpi', () => {
    expect(() => planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 0 })).toThrow(RangeError);
  });

  it('rejects non-positive sheet dimensions', () => {
    expect(() => planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 300, sheetWidthMm: 0 })).toThrow(RangeError);
  });

  it('rejects non-positive photo dimensions', () => {
    expect(() => planPrintSheet({ widthMm: 0, heightMm: 45 }, { ...SHEET_6X4_IN, dpi: 300 })).toThrow(RangeError);
  });

  it('rejects a negative margin or gutter', () => {
    expect(() => planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 300, marginMm: -1 })).toThrow(RangeError);
    expect(() => planPrintSheet(US_PHOTO, { ...SHEET_6X4_IN, dpi: 300, gutterMm: -1 })).toThrow(RangeError);
  });
});
