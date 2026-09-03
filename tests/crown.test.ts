import { describe, expect, it } from 'vitest';
import { alphaChannelOf, findCrownY } from '@/lib/photo/crown.js';

const W = 20;
const H = 20;

/** Build a mask and fill a rectangle of it with the given alpha. */
function maskWith(
  rects: ReadonlyArray<{ x0: number; x1: number; y0: number; y1: number; alpha?: number }>,
): Uint8Array {
  const mask = new Uint8Array(W * H);
  for (const r of rects) {
    for (let y = r.y0; y <= r.y1; y += 1) {
      for (let x = r.x0; x <= r.x1; x += 1) {
        mask[y * W + x] = r.alpha ?? 255;
      }
    }
  }
  return mask;
}

describe('findCrownY', () => {
  it('returns the first row holding enough foreground', () => {
    const mask = maskWith([{ x0: 8, x1: 12, y0: 5, y1: H - 1 }]);
    expect(findCrownY(mask, W, H, { centreX: 10, bandWidth: 10 })).toBe(5);
  });

  it('returns null for an empty mask', () => {
    expect(findCrownY(new Uint8Array(W * H), W, H, { centreX: 10, bandWidth: 10 })).toBeNull();
  });

  it('ignores speckle above the head', () => {
    const mask = maskWith([
      { x0: 9, x1: 10, y0: 2, y1: 2 },
      { x0: 8, x1: 12, y0: 6, y1: H - 1 },
    ]);
    expect(findCrownY(mask, W, H, { centreX: 10, bandWidth: 10, minForegroundPx: 3 })).toBe(6);
  });

  it('accepts speckle once minForegroundPx is low enough', () => {
    const mask = maskWith([
      { x0: 9, x1: 10, y0: 2, y1: 2 },
      { x0: 8, x1: 12, y0: 6, y1: H - 1 },
    ]);
    expect(findCrownY(mask, W, H, { centreX: 10, bandWidth: 10, minForegroundPx: 2 })).toBe(2);
  });

  it('ignores foreground outside the search band, such as a raised hand', () => {
    const mask = maskWith([{ x0: 0, x1: 2, y0: 1, y1: H - 1 }]);
    expect(findCrownY(mask, W, H, { centreX: 15, bandWidth: 6 })).toBeNull();
  });

  it('clamps the band to the mask edges', () => {
    const mask = maskWith([{ x0: 0, x1: 4, y0: 7, y1: H - 1 }]);
    expect(findCrownY(mask, W, H, { centreX: 0, bandWidth: 10 })).toBe(7);
  });

  it('returns null when the band falls entirely off the mask', () => {
    const mask = maskWith([{ x0: 8, x1: 12, y0: 5, y1: H - 1 }]);
    expect(findCrownY(mask, W, H, { centreX: -100, bandWidth: 2 })).toBeNull();
  });

  it('respects the alpha threshold', () => {
    const mask = maskWith([{ x0: 8, x1: 12, y0: 3, y1: H - 1, alpha: 100 }]);
    expect(findCrownY(mask, W, H, { centreX: 10, bandWidth: 10 })).toBeNull();
    expect(findCrownY(mask, W, H, { centreX: 10, bandWidth: 10, threshold: 50 })).toBe(3);
  });

  it('treats alpha exactly on the threshold as foreground', () => {
    const mask = maskWith([{ x0: 8, x1: 12, y0: 4, y1: H - 1, alpha: 128 }]);
    expect(findCrownY(mask, W, H, { centreX: 10, bandWidth: 10, threshold: 128 })).toBe(4);
  });

  it('rejects invalid mask dimensions', () => {
    expect(() => findCrownY(new Uint8Array(4), 0, 2, { centreX: 1, bandWidth: 2 })).toThrow(RangeError);
    expect(() => findCrownY(new Uint8Array(4), 2.5, 2, { centreX: 1, bandWidth: 2 })).toThrow(RangeError);
  });

  it('rejects a buffer smaller than the stated dimensions', () => {
    expect(() => findCrownY(new Uint8Array(10), W, H, { centreX: 10, bandWidth: 4 })).toThrow(RangeError);
  });

  it('rejects an invalid search band', () => {
    const mask = new Uint8Array(W * H);
    expect(() => findCrownY(mask, W, H, { centreX: 10, bandWidth: 0 })).toThrow(RangeError);
    expect(() => findCrownY(mask, W, H, { centreX: Number.NaN, bandWidth: 4 })).toThrow(RangeError);
  });
});

describe('alphaChannelOf', () => {
  it('pulls the alpha channel out of an RGBA buffer', () => {
    const rgba = new Uint8Array([1, 2, 3, 10, 4, 5, 6, 20, 7, 8, 9, 30]);
    expect(Array.from(alphaChannelOf(rgba))).toEqual([10, 20, 30]);
  });

  it('returns an empty result for an empty buffer', () => {
    expect(alphaChannelOf(new Uint8Array(0))).toHaveLength(0);
  });

  it('rejects a buffer that is not RGBA-aligned', () => {
    expect(() => alphaChannelOf(new Uint8Array(7))).toThrow(RangeError);
  });
});
