/**
 * Locating the crown of the head.
 *
 * Face-landmark models do not mark the top of the skull: their topmost point sits
 * around the hairline, and hair above it is invisible to them. Every photo spec
 * measures head height to the top of the head *including* hair, so a landmark
 * estimate is systematically short — and since head height is the single most
 * common rejection reason, that error is the one that matters most.
 *
 * The person-segmentation mask computed for background replacement already knows
 * where the hair ends, so the crown is read from the mask instead. This module is
 * the pure scan over that mask, kept separate from the browser adapters so it can
 * be tested against synthetic masks.
 */

export interface CrownScanOptions {
  /** Horizontal centre of the face, in mask pixels. */
  readonly centreX: number;
  /** Width of the column band searched around `centreX`, in mask pixels. */
  readonly bandWidth: number;
  /** Alpha at or above this counts as foreground. */
  readonly threshold?: number;
  /**
   * Foreground pixels required in a row before it counts as the crown.
   * Guards against isolated speckle at the top of an imperfect mask.
   */
  readonly minForegroundPx?: number;
}

const DEFAULT_THRESHOLD = 128;
const DEFAULT_MIN_FOREGROUND_PX = 3;

/**
 * Scan an alpha mask downwards and return the first row that looks like the top
 * of the head, or `null` when the mask holds no foreground in the search band.
 *
 * The scan is limited to a band around the face midline so that a raised hand,
 * a shoulder or a hat brim off to one side cannot be mistaken for the crown.
 */
export function findCrownY(
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  options: CrownScanOptions,
): number | null {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(`mask dimensions must be positive integers, received ${width}x${height}`);
  }
  if (alpha.length < width * height) {
    throw new RangeError(`alpha buffer holds ${alpha.length} values, need ${width * height}`);
  }
  if (!Number.isFinite(options.centreX) || !Number.isFinite(options.bandWidth) || options.bandWidth <= 0) {
    throw new RangeError('centreX must be finite and bandWidth must be positive');
  }

  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const minForegroundPx = options.minForegroundPx ?? DEFAULT_MIN_FOREGROUND_PX;

  const half = options.bandWidth / 2;
  const startX = Math.max(0, Math.floor(options.centreX - half));
  const endX = Math.min(width - 1, Math.ceil(options.centreX + half));
  if (startX > endX) return null;

  for (let y = 0; y < height; y += 1) {
    let foreground = 0;
    const rowStart = y * width;
    for (let x = startX; x <= endX; x += 1) {
      if ((alpha[rowStart + x] ?? 0) >= threshold) {
        foreground += 1;
        if (foreground >= minForegroundPx) return y;
      }
    }
  }

  return null;
}

/**
 * Extract the alpha channel from RGBA image data.
 *
 * Segmentation models emit masks in several layouts; this handles the common case
 * where the mask arrives as an RGBA buffer with the result in the alpha channel.
 */
export function alphaChannelOf(rgba: Uint8Array | Uint8ClampedArray): Uint8Array {
  if (rgba.length % 4 !== 0) {
    throw new RangeError(`RGBA buffer length ${rgba.length} is not a multiple of 4`);
  }
  const out = new Uint8Array(rgba.length / 4);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = rgba[i * 4 + 3] ?? 0;
  }
  return out;
}
