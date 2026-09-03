export interface QualitySearchResult {
  /** JPEG quality in 0..1 that met the budget. */
  readonly quality: number;
  /** Encoded size in bytes at that quality. */
  readonly bytes: number;
}

export interface QualitySearchOptions {
  readonly minQuality?: number;
  readonly maxQuality?: number;
  /** Bisection steps. 8 lands within ~0.004 of the optimum over 0.3..0.95. */
  readonly iterations?: number;
}

/**
 * Find the highest JPEG quality whose encoded size fits `maxBytes`.
 *
 * Several government portals reject uploads over a hard byte ceiling (the US DV
 * lottery caps at 240KB), so the pipeline has to search rather than guess. The
 * encoder is injected as `measure`, which keeps this layer pure and testable
 * without a canvas.
 *
 * Returns `null` when even `minQuality` overshoots the budget: the caller must
 * then reduce pixel dimensions, because quality alone cannot get there.
 */
export async function findQualityForByteBudget(
  measure: (quality: number) => Promise<number>,
  maxBytes: number,
  options: QualitySearchOptions = {},
): Promise<QualitySearchResult | null> {
  const minQuality = options.minQuality ?? 0.3;
  const maxQuality = options.maxQuality ?? 0.95;
  const iterations = options.iterations ?? 8;

  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    throw new RangeError(`maxBytes must be a finite positive number, received ${maxBytes}`);
  }
  if (!(minQuality > 0 && maxQuality <= 1 && minQuality <= maxQuality)) {
    throw new RangeError(`quality bounds must satisfy 0 < min <= max <= 1, received ${minQuality}..${maxQuality}`);
  }
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new RangeError(`iterations must be a positive integer, received ${iterations}`);
  }

  // Best quality first: when the budget is generous there is no reason to compress harder.
  const bytesAtMax = await measure(maxQuality);
  if (bytesAtMax <= maxBytes) return { quality: maxQuality, bytes: bytesAtMax };

  const bytesAtMin = await measure(minQuality);
  if (bytesAtMin > maxBytes) return null;

  let low = minQuality;
  let high = maxQuality;
  let best: QualitySearchResult = { quality: minQuality, bytes: bytesAtMin };

  for (let step = 0; step < iterations; step += 1) {
    const mid = (low + high) / 2;
    const bytes = await measure(mid);
    if (bytes <= maxBytes) {
      best = { quality: mid, bytes };
      low = mid;
    } else {
      high = mid;
    }
  }

  return best;
}
