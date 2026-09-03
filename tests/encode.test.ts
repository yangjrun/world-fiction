import { describe, expect, it, vi } from 'vitest';
import { findQualityForByteBudget } from '@/lib/photo/encode.js';

/** A stand-in encoder whose size grows linearly with quality. */
function linearEncoder(bytesAtFullQuality: number) {
  return vi.fn(async (quality: number) => Math.round(quality * bytesAtFullQuality));
}

describe('findQualityForByteBudget', () => {
  it('returns the highest quality immediately when the budget is generous', async () => {
    const measure = linearEncoder(1_000_000);
    const result = await findQualityForByteBudget(measure, 2_000_000);
    expect(result).toEqual({ quality: 0.95, bytes: 950_000 });
    expect(measure).toHaveBeenCalledTimes(1);
  });

  it('bisects to the highest quality that still fits', async () => {
    const measure = linearEncoder(1_000_000);
    const result = await findQualityForByteBudget(measure, 500_000);
    expect(result).not.toBeNull();
    expect(result!.bytes).toBeLessThanOrEqual(500_000);
    expect(result!.quality).toBeCloseTo(0.5, 2);
    expect(result!.quality).toBeLessThanOrEqual(0.5);
  });

  it('never returns a result over budget', async () => {
    const measure = linearEncoder(1_000_000);
    for (const budget of [310_000, 400_000, 650_000, 900_000]) {
      const result = await findQualityForByteBudget(measure, budget);
      expect(result).not.toBeNull();
      expect(result!.bytes).toBeLessThanOrEqual(budget);
    }
  });

  it('returns null when even the lowest quality overshoots', async () => {
    const measure = linearEncoder(1_000_000);
    expect(await findQualityForByteBudget(measure, 100_000)).toBeNull();
  });

  it('respects custom quality bounds', async () => {
    const measure = linearEncoder(1_000_000);
    const result = await findQualityForByteBudget(measure, 900_000, { minQuality: 0.6, maxQuality: 0.8 });
    expect(result).toEqual({ quality: 0.8, bytes: 800_000 });
  });

  it('converges tighter with more iterations', async () => {
    const coarse = await findQualityForByteBudget(linearEncoder(1_000_000), 500_000, { iterations: 2 });
    const fine = await findQualityForByteBudget(linearEncoder(1_000_000), 500_000, { iterations: 12 });
    expect(0.5 - fine!.quality).toBeLessThan(0.5 - coarse!.quality);
  });

  it('rejects a non-positive budget', async () => {
    await expect(findQualityForByteBudget(linearEncoder(1000), 0)).rejects.toThrow(RangeError);
    await expect(findQualityForByteBudget(linearEncoder(1000), Number.NaN)).rejects.toThrow(RangeError);
  });

  it('rejects invalid quality bounds', async () => {
    const measure = linearEncoder(1000);
    await expect(findQualityForByteBudget(measure, 500, { minQuality: 0.9, maxQuality: 0.4 })).rejects.toThrow(RangeError);
    await expect(findQualityForByteBudget(measure, 500, { minQuality: 0 })).rejects.toThrow(RangeError);
    await expect(findQualityForByteBudget(measure, 500, { maxQuality: 1.2 })).rejects.toThrow(RangeError);
  });

  it('rejects a non-positive iteration count', async () => {
    await expect(findQualityForByteBudget(linearEncoder(1000), 500, { iterations: 0 })).rejects.toThrow(RangeError);
    await expect(findQualityForByteBudget(linearEncoder(1000), 500, { iterations: 1.5 })).rejects.toThrow(RangeError);
  });
});
