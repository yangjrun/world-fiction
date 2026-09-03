import { describe, expect, it } from 'vitest';
import {
  BIREFNET,
  MATTING_MODELS,
  U2NETP,
  assertCommercialUseAllowed,
  mattingModelById,
  type MattingModelConfig,
} from '@/lib/photo/matting-model.js';

const NON_COMMERCIAL: MattingModelConfig = {
  ...U2NETP,
  id: 'rmbg-1.4',
  license: 'bria-rmbg-1.4 (non-commercial)',
  commercialUseAllowed: false,
};

describe('assertCommercialUseAllowed', () => {
  it('permits the models cleared for commercial use', () => {
    expect(() => assertCommercialUseAllowed(U2NETP)).not.toThrow();
    expect(() => assertCommercialUseAllowed(BIREFNET)).not.toThrow();
  });

  it('refuses a model whose licence forbids commercial use', () => {
    expect(() => assertCommercialUseAllowed(NON_COMMERCIAL)).toThrow(/does not permit commercial use/);
  });

  it('names the model and its licence so the failure is actionable', () => {
    expect(() => assertCommercialUseAllowed(NON_COMMERCIAL)).toThrow(/rmbg-1\.4/);
    expect(() => assertCommercialUseAllowed(NON_COMMERCIAL)).toThrow(/non-commercial/);
  });
});

describe('the registry', () => {
  it('keys every model by its own id', () => {
    for (const [key, model] of Object.entries(MATTING_MODELS)) {
      expect(key).toBe(model.id);
    }
  });

  it('ships only commercially usable models', () => {
    for (const model of Object.values(MATTING_MODELS)) {
      expect(model.commercialUseAllowed).toBe(true);
    }
  });

  it('serves every model from this origin rather than a third party', () => {
    for (const model of Object.values(MATTING_MODELS)) {
      expect(model.url.startsWith('/')).toBe(true);
    }
  });

  it('declares a positive input size and normalisation for every model', () => {
    for (const model of Object.values(MATTING_MODELS)) {
      expect(model.inputWidth).toBeGreaterThan(0);
      expect(model.inputHeight).toBeGreaterThan(0);
      expect(model.mean).toHaveLength(3);
      expect(model.std).toHaveLength(3);
      expect(model.std.every((s) => s > 0)).toBe(true);
    }
  });
});

describe('mattingModelById', () => {
  it('resolves a known id', () => {
    expect(mattingModelById('u2netp')).toBe(U2NETP);
    expect(mattingModelById('birefnet')).toBe(BIREFNET);
  });

  it('lists the known ids when given an unknown one', () => {
    expect(() => mattingModelById('rmbg')).toThrow(/u2netp/);
    expect(() => mattingModelById('rmbg')).toThrow(RangeError);
  });
});
