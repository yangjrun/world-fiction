import type { CropPlan } from './geometry.js';
import type { PrintSheetPlan } from './sheet.js';

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyContext2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: AnyCanvas): AnyContext2D {
  const ctx = canvas.getContext('2d') as AnyContext2D | null;
  if (!ctx) throw new Error('2D canvas context unavailable');
  return ctx;
}

/** Build a canvas holding the alpha mask, for use as a compositing stencil. */
function maskCanvas(alpha: Uint8Array, width: number, height: number): AnyCanvas {
  const canvas = createCanvas(width, height);
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < alpha.length; i += 1) rgba[i * 4 + 3] = alpha[i] ?? 0;
  context2d(canvas).putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvas;
}

export interface RenderPhotoInput {
  readonly image: ImageBitmap | HTMLCanvasElement | HTMLImageElement;
  readonly alpha: Uint8Array;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly plan: CropPlan;
  /** sRGB hex fill placed behind the subject. */
  readonly backgroundColor: string;
}

/**
 * Produce the finished photo: subject cut out, placed on the required background
 * colour, cropped and scaled to the spec's exact pixel size.
 *
 * The cut-out uses `destination-in` compositing rather than a pixel loop over the
 * full-resolution image, which keeps a 12-megapixel source from costing a 48MB
 * `getImageData` round trip on every adjustment.
 */
export function renderPhoto(input: RenderPhotoInput): AnyCanvas {
  const { plan } = input;
  const subject = createCanvas(input.sourceWidth, input.sourceHeight);
  const subjectCtx = context2d(subject);
  subjectCtx.drawImage(input.image as CanvasImageSource, 0, 0, input.sourceWidth, input.sourceHeight);
  subjectCtx.globalCompositeOperation = 'destination-in';
  subjectCtx.drawImage(maskCanvas(input.alpha, input.sourceWidth, input.sourceHeight) as CanvasImageSource, 0, 0);

  const out = createCanvas(plan.outputWidthPx, plan.outputHeightPx);
  const ctx = context2d(out);
  ctx.fillStyle = input.backgroundColor;
  ctx.fillRect(0, 0, plan.outputWidthPx, plan.outputHeightPx);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    subject as CanvasImageSource,
    plan.rect.x,
    plan.rect.y,
    plan.rect.width,
    plan.rect.height,
    0,
    0,
    plan.outputWidthPx,
    plan.outputHeightPx,
  );
  return out;
}

export async function encodeCanvas(canvas: AnyCanvas, format: 'jpeg' | 'png', quality: number): Promise<Blob> {
  const type = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality });
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas encoding failed'))), type, quality);
  });
}

export interface PrintSheetRenderOptions {
  /** Colour of the cut guides. Light enough to disappear after trimming. */
  readonly guideColor?: string;
  readonly drawGuides?: boolean;
}

/**
 * Tile the finished photo across a print sheet.
 *
 * When the layout turned the photo a quarter turn to fit more per sheet, each
 * copy is rotated about its own centre at draw time; the plan's cell rectangles
 * are already expressed in the rotated orientation.
 */
export function renderPrintSheet(
  photo: AnyCanvas,
  plan: PrintSheetPlan,
  options: PrintSheetRenderOptions = {},
): AnyCanvas {
  const sheet = createCanvas(plan.sheetWidthPx, plan.sheetHeightPx);
  const ctx = context2d(sheet);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, plan.sheetWidthPx, plan.sheetHeightPx);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (const cell of plan.cells) {
    if (plan.rotatedQuarterTurn) {
      ctx.save();
      ctx.translate(cell.x + cell.width / 2, cell.y + cell.height / 2);
      ctx.rotate(Math.PI / 2);
      // After the quarter turn the cell's width and height swap roles.
      ctx.drawImage(photo as CanvasImageSource, -cell.height / 2, -cell.width / 2, cell.height, cell.width);
      ctx.restore();
    } else {
      ctx.drawImage(photo as CanvasImageSource, cell.x, cell.y, cell.width, cell.height);
    }
  }

  if (options.drawGuides !== false) {
    ctx.strokeStyle = options.guideColor ?? 'rgba(120,120,120,0.55)';
    ctx.lineWidth = 1;
    for (const cell of plan.cells) {
      ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, cell.width - 1, cell.height - 1);
    }
  }

  return sheet;
}
