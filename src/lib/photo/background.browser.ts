import * as ort from 'onnxruntime-web/wasm';
import { assertCommercialUseAllowed, type MattingModelConfig } from './matting-model.js';

export interface SegmentationResult {
  /** One alpha byte per source pixel, row-major. */
  readonly alpha: Uint8Array;
  readonly width: number;
  readonly height: number;
}

export interface PersonSegmenter {
  segment(image: ImageBitmap | HTMLCanvasElement | HTMLImageElement): Promise<SegmentationResult>;
  close(): Promise<void>;
}

/** Directory holding the onnxruntime-web WASM binaries, served from this origin. */
export const ORT_WASM_PATH = '/wasm/ort/';

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

function makeCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: AnyCanvas): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error('2D canvas context unavailable');
  return ctx;
}

/** Draw the source into the model's input size and build a normalised NCHW tensor. */
function toInputTensor(
  image: ImageBitmap | HTMLCanvasElement | HTMLImageElement,
  model: MattingModelConfig,
): ort.Tensor {
  const { inputWidth: w, inputHeight: h } = model;
  const ctx = context2d(makeCanvas(w, h));
  ctx.drawImage(image as CanvasImageSource, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const plane = w * h;
  const out = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i += 1) {
    const r = (data[i * 4] ?? 0) / 255;
    const g = (data[i * 4 + 1] ?? 0) / 255;
    const b = (data[i * 4 + 2] ?? 0) / 255;
    out[i] = (r - model.mean[0]) / model.std[0];
    out[plane + i] = (g - model.mean[1]) / model.std[1];
    out[2 * plane + i] = (b - model.mean[2]) / model.std[2];
  }
  return new ort.Tensor('float32', out, [1, 3, h, w]);
}

/**
 * Scale raw model output into 0..255.
 *
 * Min-max rather than a fixed sigmoid: some exports of these architectures emit
 * probabilities and others emit logits, and min-max lands both in range without
 * needing to know which one this file is.
 */
function toBytes(values: Float32Array): Uint8Array {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min;
  const out = new Uint8Array(values.length);
  if (span <= Number.EPSILON) return out;
  for (let i = 0; i < values.length; i += 1) {
    out[i] = Math.round((((values[i] ?? min) - min) / span) * 255);
  }
  return out;
}

/** Resample a mask from model resolution up to the source image resolution. */
function resampleMask(
  mask: Uint8Array,
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number,
): Uint8Array {
  const small = makeCanvas(fromWidth, fromHeight);
  const smallCtx = context2d(small);
  const rgba = new Uint8ClampedArray(fromWidth * fromHeight * 4);
  for (let i = 0; i < mask.length; i += 1) {
    const v = mask[i] ?? 0;
    rgba[i * 4] = v;
    rgba[i * 4 + 1] = v;
    rgba[i * 4 + 2] = v;
    rgba[i * 4 + 3] = 255;
  }
  smallCtx.putImageData(new ImageData(rgba, fromWidth, fromHeight), 0, 0);

  const large = makeCanvas(toWidth, toHeight);
  const largeCtx = context2d(large);
  largeCtx.imageSmoothingEnabled = true;
  largeCtx.imageSmoothingQuality = 'high';
  largeCtx.drawImage(small as CanvasImageSource, 0, 0, toWidth, toHeight);

  const { data } = largeCtx.getImageData(0, 0, toWidth, toHeight);
  const out = new Uint8Array(toWidth * toHeight);
  for (let i = 0; i < out.length; i += 1) out[i] = data[i * 4] ?? 0;
  return out;
}

/**
 * Create a person segmenter backed by an ONNX matting model.
 *
 * Throws before loading anything if the model's licence does not permit
 * commercial use, since this site carries advertising.
 */
export async function createPersonSegmenter(model: MattingModelConfig): Promise<PersonSegmenter> {
  assertCommercialUseAllowed(model);

  // Vite adds ?import to root-relative dynamic imports and then rejects files
  // in public/. An absolute same-origin URL keeps the loader a static request.
  ort.env.wasm.wasmPaths = new URL(ORT_WASM_PATH, globalThis.location.href).href;
  const session = await ort.InferenceSession.create(model.url, { executionProviders: ['wasm'] });

  // Unset means "the fused prediction", which these architectures put first.
  const outputName = model.outputName ?? session.outputNames[0];
  if (!outputName) {
    throw new Error(`Model "${model.id}" exposes no outputs`);
  }

  return {
    async segment(image) {
      const width = Number((image as { width: number }).width);
      const height = Number((image as { height: number }).height);
      if (!width || !height) throw new Error('source image has no intrinsic size');

      const results = await session.run({ [model.inputName]: toInputTensor(image, model) });
      const output = results[outputName];
      if (!output) {
        throw new Error(
          `Model "${model.id}" produced no tensor named "${outputName}". Available: ${Object.keys(results).join(', ')}`,
        );
      }

      const bytes = toBytes(output.data as Float32Array);
      return {
        alpha: resampleMask(bytes, model.inputWidth, model.inputHeight, width, height),
        width,
        height,
      };
    },
    async close() {
      await session.release();
    },
  };
}
