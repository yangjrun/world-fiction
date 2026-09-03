import { findCrownY } from './crown.js';
import { encodeCanvas, renderPhoto } from './render.browser.js';
import { findQualityForByteBudget } from './encode.js';
import { planCrop, type CropPlan, type EdgeOverflow } from './geometry.js';
import { checkCompliance, type Finding } from './validate.js';
import type { FaceDetector } from './face-detect.browser.js';
import type { PersonSegmenter } from './background.browser.js';
import type { FaceMetrics, PhotoSpec } from './types.js';

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

/** Quality used when a spec sets no byte ceiling. High enough to look untouched. */
const DEFAULT_QUALITY = 0.92;

/**
 * Width of the column band searched for the crown, as a multiple of the
 * eye-to-chin distance.
 *
 * Kept narrow and centred on the face midline on purpose: the crown is the top of
 * the head at the midline, and a wider band would instead find whichever tuft of
 * hair or hat brim rises highest off to one side.
 */
const CROWN_BAND_FACTOR = 0.8;

export interface PhotoResult {
  readonly canvas: AnyCanvas;
  readonly blob: Blob;
  readonly bytes: number;
  readonly quality: number;
  readonly plan: CropPlan;
  readonly face: FaceMetrics;
  readonly findings: readonly Finding[];
}

export type PipelineOutcome =
  | { readonly ok: true; readonly result: PhotoResult }
  | { readonly ok: false; readonly reason: 'no-face'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'no-subject'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'invalid-face-metrics'; readonly detail: string }
  | {
      readonly ok: false;
      readonly reason: 'insufficient-margin';
      readonly plan: CropPlan;
      readonly overflow: EdgeOverflow;
    }
  | { readonly ok: false; readonly reason: 'cannot-meet-byte-budget'; readonly maxBytes: number };

export interface PipelineDeps {
  readonly detector: FaceDetector;
  readonly segmenter: PersonSegmenter;
}

export interface PipelineInput {
  readonly image: ImageBitmap | HTMLCanvasElement | HTMLImageElement;
  readonly spec: PhotoSpec;
  /** Index into `spec.background.colors`. Defaults to the first, the safest choice. */
  readonly backgroundColorIndex?: number;
}

/**
 * Turn a source photograph into a spec-compliant image.
 *
 * Order matters: segmentation runs first because its mask is what reveals the top
 * of the head including hair, which the landmark model cannot see. Head height is
 * the most common rejection reason, so measuring it from the mask rather than
 * estimating it from the hairline is the difference between a photo that passes
 * and one that does not.
 */
export async function runPipeline(
  deps: PipelineDeps,
  input: PipelineInput,
): Promise<PipelineOutcome> {
  const { image, spec } = input;
  const segmentation = await deps.segmenter.segment(image);
  const { alpha, width, height } = segmentation;

  const partial = await deps.detector.detect(image);
  if (!partial) {
    return { ok: false, reason: 'no-face', detail: 'No face was found. Use a photo taken face-on to the camera.' };
  }

  const bandWidth = Math.max(8, (partial.chinY - partial.eyeY) * CROWN_BAND_FACTOR);
  const crownY = findCrownY(alpha, width, height, { centreX: partial.faceCentreX, bandWidth });
  if (crownY === null) {
    return {
      ok: false,
      reason: 'no-subject',
      detail: 'The subject could not be separated from the background. Try a photo with more contrast behind the head.',
    };
  }

  const face: FaceMetrics = { crownY, chinY: partial.chinY, eyeY: partial.eyeY, faceCentreX: partial.faceCentreX };
  const cropped = planCrop(face, spec, { width, height });
  if (!cropped.ok) {
    return cropped.reason === 'insufficient-margin'
      ? { ok: false, reason: 'insufficient-margin', plan: cropped.plan, overflow: cropped.overflow }
      : { ok: false, reason: 'invalid-face-metrics', detail: cropped.detail };
  }

  const colors = spec.background.colors;
  const backgroundColor = colors[input.backgroundColorIndex ?? 0] ?? colors[0]!;
  const canvas = renderPhoto({
    image,
    alpha,
    sourceWidth: width,
    sourceHeight: height,
    plan: cropped.plan,
    backgroundColor,
  });

  const encoded = await encodeToBudget(canvas, spec);
  if (!encoded) {
    return { ok: false, reason: 'cannot-meet-byte-budget', maxBytes: spec.file.maxBytes! };
  }

  const findings = checkCompliance(spec, {
    widthPx: cropped.plan.outputWidthPx,
    heightPx: cropped.plan.outputHeightPx,
    headRatio: cropped.plan.achievedHeadRatio,
    eyeRatioFromBottom: cropped.plan.achievedEyeRatioFromBottom,
    bytes: encoded.blob.size,
  });

  return {
    ok: true,
    result: {
      canvas,
      blob: encoded.blob,
      bytes: encoded.blob.size,
      quality: encoded.quality,
      plan: cropped.plan,
      face,
      findings,
    },
  };
}

/**
 * Encode within the spec's byte ceiling, searching for the best quality that fits.
 *
 * Specs without a ceiling take a single encode at a fixed high quality; there is
 * nothing to search for and repeated encodes would only cost time.
 */
async function encodeToBudget(
  canvas: AnyCanvas,
  spec: PhotoSpec,
): Promise<{ readonly blob: Blob; readonly quality: number } | null> {
  const { format, maxBytes } = spec.file;
  if (maxBytes === undefined) {
    return { blob: await encodeCanvas(canvas, format, DEFAULT_QUALITY), quality: DEFAULT_QUALITY };
  }

  const found = await findQualityForByteBudget(
    async (quality) => (await encodeCanvas(canvas, format, quality)).size,
    maxBytes,
  );
  if (!found) return null;
  return { blob: await encodeCanvas(canvas, format, found.quality), quality: found.quality };
}
