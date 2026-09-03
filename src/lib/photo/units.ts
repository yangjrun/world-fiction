import type { OutputSize, Pixels } from './types.js';

export const MM_PER_INCH = 25.4;

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite positive number, received ${value}`);
  }
}

/** Convert millimetres to pixels at a given DPI. Returns an unrounded value. */
export function mmToPxExact(mm: number, dpi: number): number {
  assertFinitePositive(dpi, 'dpi');
  if (!Number.isFinite(mm)) {
    throw new RangeError(`mm must be finite, received ${mm}`);
  }
  return (mm / MM_PER_INCH) * dpi;
}

/** Convert millimetres to a whole number of pixels at a given DPI. */
export function mmToPx(mm: number, dpi: number): Pixels {
  return Math.round(mmToPxExact(mm, dpi));
}

/** Convert pixels back to millimetres at a given DPI. */
export function pxToMm(px: number, dpi: number): number {
  assertFinitePositive(dpi, 'dpi');
  if (!Number.isFinite(px)) {
    throw new RangeError(`px must be finite, received ${px}`);
  }
  return (px / dpi) * MM_PER_INCH;
}

export function inchToMm(inch: number): number {
  if (!Number.isFinite(inch)) {
    throw new RangeError(`inch must be finite, received ${inch}`);
  }
  return inch * MM_PER_INCH;
}

/**
 * The pixel dimensions a spec's output must have.
 *
 * For a `physical` spec this is derived from millimetres and DPI; for a
 * `digital` spec the pixel counts are authoritative and returned verbatim.
 */
export function resolvePixelSize(output: OutputSize): { readonly widthPx: Pixels; readonly heightPx: Pixels } {
  if (output.kind === 'digital') {
    assertFinitePositive(output.widthPx, 'widthPx');
    assertFinitePositive(output.heightPx, 'heightPx');
    return { widthPx: Math.round(output.widthPx), heightPx: Math.round(output.heightPx) };
  }
  assertFinitePositive(output.widthMm, 'widthMm');
  assertFinitePositive(output.heightMm, 'heightMm');
  return {
    widthPx: mmToPx(output.widthMm, output.dpi),
    heightPx: mmToPx(output.heightMm, output.dpi),
  };
}

/**
 * The physical print size of a spec, or `null` for digital-only specs which
 * have no defined physical size and therefore cannot be laid out on a print sheet.
 */
export function resolvePhysicalSize(
  output: OutputSize,
): { readonly widthMm: number; readonly heightMm: number; readonly dpi: number } | null {
  if (output.kind === 'digital') return null;
  return { widthMm: output.widthMm, heightMm: output.heightMm, dpi: output.dpi };
}
