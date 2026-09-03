import { describe, expect, it } from 'vitest';
import { checkCompliance, hasBlockingFinding } from '@/lib/photo/validate.js';
import { DV_LOTTERY, US_PASSPORT } from './fixtures.js';

const CLEAN = { widthPx: 600, heightPx: 600, headRatio: 0.59375, eyeRatioFromBottom: 0.625 };

function codes(findings: readonly { code: string }[]): string[] {
  return findings.map((f) => f.code);
}

describe('checkCompliance', () => {
  it('reports nothing for a compliant image', () => {
    expect(checkCompliance(US_PASSPORT, CLEAN)).toEqual([]);
  });

  it('flags a pixel size that does not match the spec', () => {
    const findings = checkCompliance(US_PASSPORT, { ...CLEAN, widthPx: 640 });
    expect(codes(findings)).toContain('dimensions.mismatch');
    expect(findings[0]?.message).toContain('600x600px');
  });

  it('flags a head that is too small or too large', () => {
    expect(codes(checkCompliance(US_PASSPORT, { ...CLEAN, headRatio: 0.42 }))).toContain('head.out-of-range');
    expect(codes(checkCompliance(US_PASSPORT, { ...CLEAN, headRatio: 0.75 }))).toContain('head.out-of-range');
  });

  it('accepts head ratios exactly on the boundary', () => {
    expect(checkCompliance(US_PASSPORT, { ...CLEAN, headRatio: 25.4 / 50.8 })).toEqual([]);
    expect(checkCompliance(US_PASSPORT, { ...CLEAN, headRatio: 34.925 / 50.8 })).toEqual([]);
  });

  it('flags an eye line outside the allowed band', () => {
    const findings = checkCompliance(US_PASSPORT, { ...CLEAN, eyeRatioFromBottom: 0.5 });
    expect(codes(findings)).toContain('eyeline.out-of-range');
  });

  it('skips the eye-line check when the spec has no such rule', () => {
    const findings = checkCompliance(DV_LOTTERY, { widthPx: 600, heightPx: 600, headRatio: 0.595, eyeRatioFromBottom: 0.1 });
    expect(codes(findings)).not.toContain('eyeline.out-of-range');
  });

  it('skips the eye-line check when the measurement is absent', () => {
    const findings = checkCompliance(US_PASSPORT, { widthPx: 600, heightPx: 600, headRatio: 0.59375 });
    expect(findings).toEqual([]);
  });

  it('flags a file over the upload ceiling as an error', () => {
    const findings = checkCompliance(DV_LOTTERY, {
      widthPx: 600,
      heightPx: 600,
      headRatio: 0.595,
      bytes: 300 * 1024,
    });
    expect(codes(findings)).toEqual(['file.too-large']);
    expect(findings[0]?.severity).toBe('error');
    expect(findings[0]?.message).toContain('240KB');
  });

  it('accepts a file exactly on the ceiling', () => {
    const findings = checkCompliance(DV_LOTTERY, {
      widthPx: 600,
      heightPx: 600,
      headRatio: 0.595,
      bytes: 240 * 1024,
    });
    expect(findings).toEqual([]);
  });

  it('warns rather than errors on an over-compressed file', () => {
    const spec = { ...DV_LOTTERY, file: { ...DV_LOTTERY.file, minBytes: 10 * 1024 } };
    const findings = checkCompliance(spec, { widthPx: 600, heightPx: 600, headRatio: 0.595, bytes: 4 * 1024 });
    expect(codes(findings)).toEqual(['file.too-small']);
    expect(findings[0]?.severity).toBe('warning');
  });

  it('accumulates every independent problem', () => {
    const findings = checkCompliance(US_PASSPORT, {
      widthPx: 100,
      heightPx: 100,
      headRatio: 0.9,
      eyeRatioFromBottom: 0.1,
    });
    expect(codes(findings)).toEqual(['dimensions.mismatch', 'head.out-of-range', 'eyeline.out-of-range']);
  });
});

describe('hasBlockingFinding', () => {
  it('is false for no findings', () => {
    expect(hasBlockingFinding([])).toBe(false);
  });

  it('is false when every finding is a warning', () => {
    expect(hasBlockingFinding([{ code: 'x', severity: 'warning', message: '' }])).toBe(false);
  });

  it('is true as soon as one finding is an error', () => {
    expect(
      hasBlockingFinding([
        { code: 'x', severity: 'warning', message: '' },
        { code: 'y', severity: 'error', message: '' },
      ]),
    ).toBe(true);
  });
});
