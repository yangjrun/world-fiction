import { resolvePixelSize } from './units.js';
import type { PhotoSpec } from './types.js';

export type Severity = 'error' | 'warning';

export interface Finding {
  /** Stable machine code, used for i18n and analytics. */
  readonly code: string;
  readonly severity: Severity;
  readonly message: string;
}

export interface ComplianceInput {
  readonly widthPx: number;
  readonly heightPx: number;
  /** Chin-to-crown height divided by image height. */
  readonly headRatio: number;
  /** Eye height above the bottom edge divided by image height. */
  readonly eyeRatioFromBottom?: number;
  readonly bytes?: number;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function kb(bytes: number): string {
  return `${Math.round(bytes / 1024)}KB`;
}

/**
 * Check a produced image against its spec.
 *
 * Runs on the final rendered result rather than on the plan, so rounding and
 * re-encoding drift are caught before the user downloads something that gets
 * rejected. An empty array means every checked rule passed.
 */
export function checkCompliance(spec: PhotoSpec, actual: ComplianceInput): readonly Finding[] {
  const findings: Finding[] = [];
  const expected = resolvePixelSize(spec.output);

  if (actual.widthPx !== expected.widthPx || actual.heightPx !== expected.heightPx) {
    findings.push({
      code: 'dimensions.mismatch',
      severity: 'error',
      message: `Output must be ${expected.widthPx}x${expected.heightPx}px but is ${actual.widthPx}x${actual.heightPx}px.`,
    });
  }

  const { minRatio, maxRatio } = spec.headHeight;
  if (actual.headRatio < minRatio || actual.headRatio > maxRatio) {
    findings.push({
      code: 'head.out-of-range',
      severity: 'error',
      message: `Head height is ${pct(actual.headRatio)} of the image; ${spec.documentName} requires ${pct(minRatio)}–${pct(maxRatio)}.`,
    });
  }

  if (spec.eyeLine && actual.eyeRatioFromBottom !== undefined) {
    const { minRatio: eyeMin, maxRatio: eyeMax } = spec.eyeLine;
    if (actual.eyeRatioFromBottom < eyeMin || actual.eyeRatioFromBottom > eyeMax) {
      findings.push({
        code: 'eyeline.out-of-range',
        severity: 'error',
        message: `Eyes sit ${pct(actual.eyeRatioFromBottom)} above the bottom edge; the allowed band is ${pct(eyeMin)}–${pct(eyeMax)}.`,
      });
    }
  }

  if (actual.bytes !== undefined) {
    const { maxBytes, minBytes } = spec.file;
    if (maxBytes !== undefined && actual.bytes > maxBytes) {
      findings.push({
        code: 'file.too-large',
        severity: 'error',
        message: `File is ${kb(actual.bytes)}; the upload limit is ${kb(maxBytes)}.`,
      });
    }
    if (minBytes !== undefined && actual.bytes < minBytes) {
      findings.push({
        code: 'file.too-small',
        severity: 'warning',
        message: `File is only ${kb(actual.bytes)}; portals enforcing a ${kb(minBytes)} floor may reject it as over-compressed.`,
      });
    }
  }

  return findings;
}

export function hasBlockingFinding(findings: readonly Finding[]): boolean {
  return findings.some((f) => f.severity === 'error');
}
