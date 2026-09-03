import { resolvePixelSize } from './units.js';
import type { CropRect, FaceMetrics, PhotoSpec, SourceImageSize } from './types.js';

/**
 * Fraction of the non-head vertical space that sits ABOVE the crown when a spec
 * gives no explicit eye-line rule.
 *
 * Compliant photos are not vertically centred on the head: the space below the
 * chin holds neck and shoulders, so it needs roughly twice the headroom above.
 */
const HEADROOM_SHARE_ABOVE_CROWN = 1 / 3;

export interface EdgeOverflow {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface CropPlan {
  /** Crop rectangle in source-image pixels. Deliberately unrounded. */
  readonly rect: CropRect;
  /** Output pixels per source pixel. */
  readonly scale: number;
  readonly outputWidthPx: number;
  readonly outputHeightPx: number;
  /** Chin-to-crown height divided by output height, as actually planned. */
  readonly achievedHeadRatio: number;
  /** Eye height above the bottom edge, divided by output height. */
  readonly achievedEyeRatioFromBottom: number;
}

export type CropPlanResult =
  | { readonly ok: true; readonly plan: CropPlan }
  | { readonly ok: false; readonly reason: 'invalid-face-metrics'; readonly detail: string }
  | {
      readonly ok: false;
      readonly reason: 'insufficient-margin';
      readonly plan: CropPlan;
      readonly overflow: EdgeOverflow;
    };

function midpoint(minRatio: number, maxRatio: number, label: string): number {
  if (!Number.isFinite(minRatio) || !Number.isFinite(maxRatio)) {
    throw new RangeError(`${label} bounds must be finite`);
  }
  if (minRatio <= 0 || maxRatio > 1 || minRatio > maxRatio) {
    throw new RangeError(`${label} bounds must satisfy 0 < min <= max <= 1, received ${minRatio}..${maxRatio}`);
  }
  return (minRatio + maxRatio) / 2;
}

/** The head-height ratio the planner aims for: the midpoint of the allowed range. */
export function targetHeadRatio(spec: PhotoSpec): number {
  return midpoint(spec.headHeight.minRatio, spec.headHeight.maxRatio, 'headHeight');
}

/**
 * The eye-line ratio (measured from the bottom edge) the planner aims for,
 * or `null` when the spec does not constrain the eye line.
 */
export function targetEyeRatioFromBottom(spec: PhotoSpec): number | null {
  if (!spec.eyeLine) return null;
  return midpoint(spec.eyeLine.minRatio, spec.eyeLine.maxRatio, 'eyeLine');
}

function validateFace(face: FaceMetrics): string | null {
  const values = [face.crownY, face.chinY, face.eyeY, face.faceCentreX];
  if (values.some((v) => !Number.isFinite(v))) return 'face metrics contain a non-finite value';
  if (face.chinY <= face.crownY) return 'chin must sit below the crown in image coordinates';
  if (face.eyeY < face.crownY || face.eyeY > face.chinY) return 'eye line must fall between crown and chin';
  return null;
}

function overflowOf(rect: CropRect, source: SourceImageSize): EdgeOverflow {
  return {
    top: Math.max(0, -rect.y),
    left: Math.max(0, -rect.x),
    bottom: Math.max(0, rect.y + rect.height - source.height),
    right: Math.max(0, rect.x + rect.width - source.width),
  };
}

function hasOverflow(o: EdgeOverflow): boolean {
  return o.top > 0 || o.bottom > 0 || o.left > 0 || o.right > 0;
}

/**
 * Compute the crop that makes a source photo satisfy `spec`.
 *
 * The rectangle is never clamped to the source bounds. Clamping would silently
 * change the head ratio or eye line and hand the user a photo that gets
 * rejected at the counter; returning `insufficient-margin` with per-edge
 * shortfalls lets the UI tell them to retake with more space instead.
 */
export function planCrop(face: FaceMetrics, spec: PhotoSpec, source: SourceImageSize): CropPlanResult {
  const faceProblem = validateFace(face);
  if (faceProblem) return { ok: false, reason: 'invalid-face-metrics', detail: faceProblem };
  if (!Number.isFinite(source.width) || !Number.isFinite(source.height) || source.width <= 0 || source.height <= 0) {
    return { ok: false, reason: 'invalid-face-metrics', detail: 'source image size must be positive and finite' };
  }

  const { widthPx: outputWidthPx, heightPx: outputHeightPx } = resolvePixelSize(spec.output);
  const headRatio = targetHeadRatio(spec);

  const headHeightSrc = face.chinY - face.crownY;
  const scale = (headRatio * outputHeightPx) / headHeightSrc;

  const cropHeight = outputHeightPx / scale;
  const cropWidth = outputWidthPx / scale;

  const eyeRatio = targetEyeRatioFromBottom(spec);
  const cropY =
    eyeRatio === null
      ? face.crownY - ((1 - headRatio) * HEADROOM_SHARE_ABOVE_CROWN * outputHeightPx) / scale
      : face.eyeY - ((1 - eyeRatio) * outputHeightPx) / scale;

  const rect: CropRect = {
    x: face.faceCentreX - cropWidth / 2,
    y: cropY,
    width: cropWidth,
    height: cropHeight,
  };

  const plan: CropPlan = {
    rect,
    scale,
    outputWidthPx,
    outputHeightPx,
    achievedHeadRatio: (headHeightSrc * scale) / outputHeightPx,
    achievedEyeRatioFromBottom: (rect.y + rect.height - face.eyeY) / cropHeight,
  };

  const overflow = overflowOf(rect, source);
  if (hasOverflow(overflow)) return { ok: false, reason: 'insufficient-margin', plan, overflow };
  return { ok: true, plan };
}
