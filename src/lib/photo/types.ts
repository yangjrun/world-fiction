/**
 * Domain types for passport / visa photo specifications.
 *
 * Everything here is data-only and deeply readonly: the pipeline never mutates a
 * spec or a plan, it derives a new value at each step. That keeps the geometry
 * math reproducible and makes every stage independently testable.
 */

/** Physical length in millimetres. */
export type Millimetres = number;

/** A count of image pixels. */
export type Pixels = number;

/**
 * How an authority expresses the required output size.
 *
 * `physical` is the common case (a printed 35x45mm photo at 600dpi).
 * `digital` covers online-submission-only specs that state pixels directly
 * (for example the US DV lottery, which wants exactly 600x600px).
 */
export type OutputSize =
  | {
      readonly kind: 'physical';
      readonly widthMm: Millimetres;
      readonly heightMm: Millimetres;
      readonly dpi: number;
    }
  | {
      readonly kind: 'digital';
      readonly widthPx: Pixels;
      readonly heightPx: Pixels;
    };

/**
 * Required head size, expressed as the chin-to-crown distance divided by the
 * full image height. Authorities publish this either as a ratio or as an
 * absolute millimetre range; spec data normalises to a ratio range.
 */
export interface HeadHeightRule {
  readonly minRatio: number;
  readonly maxRatio: number;
}

/**
 * Required eye position, measured from the BOTTOM edge of the image as a
 * fraction of image height. Measuring from the bottom matches how the US
 * Department of State and several others publish the rule.
 */
export interface EyeLineRule {
  readonly minRatio: number;
  readonly maxRatio: number;
}

export interface BackgroundRule {
  /** Human-readable requirement, rendered on the landing page. */
  readonly description: string;
  /** Allowed fills as sRGB hex. The first entry is used as the default. */
  readonly colors: readonly string[];
}

export interface FileRule {
  readonly format: 'jpeg' | 'png';
  /** Upper bound for online submission, in bytes. */
  readonly maxBytes?: number;
  /** Lower bound some portals enforce to reject over-compressed uploads. */
  readonly minBytes?: number;
}

/** A single country x document photo specification. */
export interface PhotoSpec {
  readonly id: string;
  readonly country: string;
  readonly countryName: string;
  readonly document: string;
  readonly documentName: string;
  readonly output: OutputSize;
  readonly headHeight: HeadHeightRule;
  readonly eyeLine?: EyeLineRule;
  readonly background: BackgroundRule;
  readonly file: FileRule;
  /** Official source URL. Required: it is the trust anchor for every page. */
  readonly sourceUrl: string;
}

/**
 * Face measurements in SOURCE image pixel coordinates, y growing downward.
 * Produced by the face-detection adapter, consumed by the pure geometry layer.
 */
export interface FaceMetrics {
  /** Top of the skull including hair, in source pixels. */
  readonly crownY: number;
  /** Bottom of the chin, in source pixels. */
  readonly chinY: number;
  /** Midpoint between the two pupils, vertical, in source pixels. */
  readonly eyeY: number;
  /** Midpoint between the two pupils, horizontal, in source pixels. */
  readonly faceCentreX: number;
}

/** An axis-aligned rectangle in source image pixels. */
export interface CropRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface SourceImageSize {
  readonly width: Pixels;
  readonly height: Pixels;
}
