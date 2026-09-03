/**
 * Matting model registry.
 *
 * This file exists to make one decision impossible to get wrong by accident.
 * The best-quality open background-removal weights — BRIA's RMBG 1.4 and 2.0 —
 * are licensed for non-commercial use only, and this site carries advertising.
 * Shipping them would be a licence breach, so the registry records the licence
 * next to every entry and `assertCommercialUseAllowed` refuses to load one that
 * is not cleared for commercial use.
 *
 * Input and output tensor names differ between exports of the same architecture.
 * Confirm them against the actual `.onnx` file before trusting an entry.
 */

export interface MattingModelConfig {
  readonly id: string;
  /** Served from this origin so a visitor's use of the tool is not disclosed to a CDN. */
  readonly url: string;
  readonly inputName: string;
  /**
   * Name of the tensor carrying the mask. Optional: leave it unset to take the
   * session's first output, which is what these architectures put the fused
   * prediction in. Exports frequently name outputs numerically, so an explicit
   * name here is only worth setting when a specific export needs it.
   */
  readonly outputName?: string;
  readonly inputWidth: number;
  readonly inputHeight: number;
  /** Per-channel normalisation applied after scaling pixels into 0..1. */
  readonly mean: readonly [number, number, number];
  readonly std: readonly [number, number, number];
  readonly license: string;
  readonly commercialUseAllowed: boolean;
  readonly approximateBytes: number;
}

/**
 * U2-Net (small variant). Apache-2.0, so cleared for commercial use.
 *
 * This export emits U2-Net's seven side outputs under numeric names
 * (`1959`..`1965`) rather than the `d0`..`d6` of the reference implementation, so
 * `outputName` is left unset and the first output — the fused `d0` — is used.
 */
export const U2NETP: MattingModelConfig = {
  id: 'u2netp',
  url: '/models/u2netp.onnx',
  inputName: 'input.1',
  inputWidth: 320,
  inputHeight: 320,
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
  license: 'Apache-2.0',
  commercialUseAllowed: true,
  approximateBytes: 4_574_861,
};

/**
 * BiRefNet. MIT, and noticeably better on hair than U2-Net, at ~220MB.
 *
 * Not verified against a downloaded export yet: `inputName` below is the name the
 * common exports use, but confirm it (and whether the first output is the mask)
 * with `session.inputNames` / `session.outputNames` before offering this to users.
 */
export const BIREFNET: MattingModelConfig = {
  id: 'birefnet',
  url: '/models/birefnet.onnx',
  inputName: 'input_image',
  inputWidth: 1024,
  inputHeight: 1024,
  mean: [0.485, 0.456, 0.406],
  std: [0.229, 0.224, 0.225],
  license: 'MIT',
  commercialUseAllowed: true,
  approximateBytes: 220_000_000,
};

export const MATTING_MODELS: Readonly<Record<string, MattingModelConfig>> = {
  [U2NETP.id]: U2NETP,
  [BIREFNET.id]: BIREFNET,
};

/**
 * Guard against loading weights this site is not licensed to use.
 *
 * Called on every segmenter construction rather than only at build time, so a
 * model injected through configuration cannot slip past.
 */
export function assertCommercialUseAllowed(model: MattingModelConfig): void {
  if (!model.commercialUseAllowed) {
    throw new Error(
      `Matting model "${model.id}" is licensed as ${model.license}, which does not permit commercial use. ` +
        'This site serves advertising, so it counts as commercial. Pick a model from MATTING_MODELS ' +
        'that is cleared, or obtain a commercial licence for this one first.',
    );
  }
}

export function mattingModelById(id: string): MattingModelConfig {
  const model = MATTING_MODELS[id];
  if (!model) {
    throw new RangeError(`Unknown matting model "${id}". Known: ${Object.keys(MATTING_MODELS).join(', ')}`);
  }
  return model;
}
