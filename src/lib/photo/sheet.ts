import { mmToPx } from './units.js';

export interface SheetCell {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface PrintSheetOptions {
  /** Paper width in millimetres (152.4 for a 6x4in photo print). */
  readonly sheetWidthMm: number;
  readonly sheetHeightMm: number;
  readonly dpi: number;
  /** Unprintable border kept clear on every edge. */
  readonly marginMm: number;
  /** Gap between adjacent photos, giving room for scissors. */
  readonly gutterMm: number;
}

export interface PrintSheetPlan {
  readonly sheetWidthPx: number;
  readonly sheetHeightPx: number;
  readonly dpi: number;
  readonly columns: number;
  readonly rows: number;
  readonly count: number;
  /** True when each photo is laid out turned a quarter turn to fit more per sheet. */
  readonly rotatedQuarterTurn: boolean;
  readonly cells: readonly SheetCell[];
}

/**
 * A 6x4 inch photo print, the cheapest size at consumer print counters.
 *
 * Margin and gutter are zero on purpose: 2x2in photos tile exactly 3x2 on 6x4in
 * with no slack whatsoever, so any gap at all costs a whole column. Kiosks print
 * these borderless and cut on drawn guide lines rather than on whitespace.
 */
export const SHEET_6X4_IN: Omit<PrintSheetOptions, 'dpi'> = {
  sheetWidthMm: 152.4,
  sheetHeightMm: 101.6,
  marginMm: 0,
  gutterMm: 0,
};

/** A4, for users printing at home. The margin covers the unprintable border. */
export const SHEET_A4: Omit<PrintSheetOptions, 'dpi'> = {
  sheetWidthMm: 210,
  sheetHeightMm: 297,
  marginMm: 10,
  gutterMm: 2,
};

/**
 * Epsilon absorbing binary-float error in millimetre arithmetic.
 *
 * 152.4 / 50.8 is not exactly 3 in IEEE-754, and a result of 2.9999999996 would
 * floor to 2 and silently drop a column of photos.
 */
const FIT_EPSILON = 1e-9;

function gridCount(itemMm: number, availableMm: number, gutterMm: number): number {
  if (itemMm <= 0 || availableMm + FIT_EPSILON < itemMm) return 0;
  // n items need n*item + (n-1)*gutter <= available.
  return Math.max(0, Math.floor((availableMm + gutterMm) / (itemMm + gutterMm) + FIT_EPSILON));
}

/**
 * Tile as many copies of a photo onto one sheet as will fit.
 *
 * Both photo orientations are tried and the denser one wins: turning a 35x45mm
 * photo a quarter turn often yields two more per 6x4in sheet, and since the user
 * cuts them out anyway the orientation on the paper does not matter.
 */
export function planPrintSheet(
  photo: { readonly widthMm: number; readonly heightMm: number },
  options: PrintSheetOptions,
): PrintSheetPlan {
  const { sheetWidthMm, sheetHeightMm, dpi, marginMm, gutterMm } = options;
  if (![sheetWidthMm, sheetHeightMm, dpi].every((v) => Number.isFinite(v) && v > 0)) {
    throw new RangeError('sheet dimensions and dpi must be finite positive numbers');
  }
  if (!Number.isFinite(photo.widthMm) || !Number.isFinite(photo.heightMm) || photo.widthMm <= 0 || photo.heightMm <= 0) {
    throw new RangeError('photo dimensions must be finite positive numbers');
  }
  if (marginMm < 0 || gutterMm < 0) {
    throw new RangeError('margin and gutter must not be negative');
  }

  const availableWidthMm = sheetWidthMm - marginMm * 2;
  const availableHeightMm = sheetHeightMm - marginMm * 2;

  const candidates = [
    { rotated: false, w: photo.widthMm, h: photo.heightMm },
    { rotated: true, w: photo.heightMm, h: photo.widthMm },
  ].map((c) => {
    const columns = gridCount(c.w, availableWidthMm, gutterMm);
    const rows = gridCount(c.h, availableHeightMm, gutterMm);
    return { ...c, columns, rows, count: columns * rows };
  });

  // Ties resolve to the unrotated layout, which reads more naturally on paper.
  const best = candidates.reduce((a, b) => (b.count > a.count ? b : a));

  const cellWidthPx = mmToPx(best.w, dpi);
  const cellHeightPx = mmToPx(best.h, dpi);
  const gutterPx = mmToPx(gutterMm, dpi);
  const sheetWidthPx = mmToPx(sheetWidthMm, dpi);
  const sheetHeightPx = mmToPx(sheetHeightMm, dpi);

  const blockWidthPx = best.columns * cellWidthPx + Math.max(0, best.columns - 1) * gutterPx;
  const blockHeightPx = best.rows * cellHeightPx + Math.max(0, best.rows - 1) * gutterPx;
  const originX = Math.round((sheetWidthPx - blockWidthPx) / 2);
  const originY = Math.round((sheetHeightPx - blockHeightPx) / 2);

  const cells: SheetCell[] = [];
  for (let row = 0; row < best.rows; row += 1) {
    for (let column = 0; column < best.columns; column += 1) {
      cells.push({
        x: originX + column * (cellWidthPx + gutterPx),
        y: originY + row * (cellHeightPx + gutterPx),
        width: cellWidthPx,
        height: cellHeightPx,
      });
    }
  }

  return {
    sheetWidthPx,
    sheetHeightPx,
    dpi,
    columns: best.columns,
    rows: best.rows,
    count: best.count,
    rotatedQuarterTurn: best.rotated,
    cells,
  };
}
