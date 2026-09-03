import { computed, ref, shallowRef } from 'vue';
import { createFaceDetector, type FaceDetector } from '@/lib/photo/face-detect.browser';
import { createPersonSegmenter, type PersonSegmenter } from '@/lib/photo/background.browser';
import { mattingModelById } from '@/lib/photo/matting-model';
import { runPipeline, type PhotoResult, type PipelineOutcome } from '@/lib/photo/pipeline.browser';
import { SHEET_6X4_IN, planPrintSheet } from '@/lib/photo/sheet';
import { encodeCanvas, renderPrintSheet } from '@/lib/photo/render.browser';
import { resolvePhysicalSize } from '@/lib/photo/units';
import type { PhotoSpec } from '@/lib/photo/types';

export type EditorStatus = 'idle' | 'loading-models' | 'processing' | 'done' | 'error';

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Turn a pipeline failure into something a person can act on. */
function describeFailure(outcome: Extract<PipelineOutcome, { ok: false }>): string {
  switch (outcome.reason) {
    case 'no-face':
    case 'no-subject':
    case 'invalid-face-metrics':
      return outcome.detail;
    case 'insufficient-margin': {
      const short = Object.entries(outcome.overflow)
        .filter(([, px]) => px > 0)
        .map(([edge]) => edge)
        .join(', ');
      return `There is not enough room around your head to make a compliant crop (short on: ${short}). Retake the photo standing further from the camera.`;
    }
    case 'cannot-meet-byte-budget':
      return `The photo cannot be compressed under the ${Math.round(outcome.maxBytes / 1024)}KB limit without falling apart. Try a source photo with a plainer background.`;
  }
}

export function usePhotoEditor(spec: PhotoSpec, mattingModelId: string) {
  const status = ref<EditorStatus>('idle');
  const errorMessage = ref('');
  const backgroundIndex = ref(0);
  const result = shallowRef<PhotoResult | null>(null);
  const photoUrl = ref('');
  const sheetUrl = ref('');
  const sheetCount = ref(0);

  const source = shallowRef<ImageBitmap | null>(null);
  const detector = shallowRef<FaceDetector | null>(null);
  const segmenter = shallowRef<PersonSegmenter | null>(null);

  const backgroundColors = computed(() => spec.background.colors);
  const isBusy = computed(() => status.value === 'loading-models' || status.value === 'processing');
  const blockingFindings = computed(() => (result.value?.findings ?? []).filter((f) => f.severity === 'error'));
  const warnings = computed(() => (result.value?.findings ?? []).filter((f) => f.severity === 'warning'));

  function revokeUrls(): void {
    for (const url of [photoUrl.value, sheetUrl.value]) if (url) URL.revokeObjectURL(url);
    photoUrl.value = '';
    sheetUrl.value = '';
  }

  /**
   * Load the models on first use rather than on page load.
   *
   * Together they are several megabytes of WASM and weights. Fetching that during
   * page load would wreck Largest Contentful Paint on a page whose entire reason
   * for existing is to rank in search results.
   */
  async function ensureModels(): Promise<void> {
    if (detector.value && segmenter.value) return;
    status.value = 'loading-models';
    const [nextDetector, nextSegmenter] = await Promise.all([
      detector.value ? Promise.resolve(detector.value) : createFaceDetector(),
      segmenter.value ? Promise.resolve(segmenter.value) : createPersonSegmenter(mattingModelById(mattingModelId)),
    ]);
    detector.value = nextDetector;
    segmenter.value = nextSegmenter;
  }

  async function buildSheet(photoCanvas: OffscreenCanvas | HTMLCanvasElement): Promise<void> {
    const physical = resolvePhysicalSize(spec.output);
    if (!physical) {
      sheetCount.value = 0;
      return;
    }
    const plan = planPrintSheet(physical, { ...SHEET_6X4_IN, dpi: physical.dpi });
    sheetCount.value = plan.count;
    if (plan.count === 0) return;
    const blob = await encodeCanvas(renderPrintSheet(photoCanvas, plan), 'jpeg', 0.94);
    sheetUrl.value = URL.createObjectURL(blob);
  }

  async function process(): Promise<void> {
    const image = source.value;
    if (!image) return;
    revokeUrls();
    status.value = 'processing';
    try {
      await ensureModels();
      const outcome = await runPipeline(
        { detector: detector.value!, segmenter: segmenter.value! },
        { image, spec, backgroundColorIndex: backgroundIndex.value },
      );
      if (!outcome.ok) {
        result.value = null;
        errorMessage.value = describeFailure(outcome);
        status.value = 'error';
        return;
      }
      result.value = outcome.result;
      photoUrl.value = URL.createObjectURL(outcome.result.blob);
      await buildSheet(outcome.result.canvas);
      status.value = 'done';
    } catch (cause) {
      result.value = null;
      errorMessage.value = cause instanceof Error ? cause.message : 'Something went wrong processing the photo.';
      status.value = 'error';
    }
  }

  async function acceptFile(file: File): Promise<void> {
    errorMessage.value = '';
    if (file.size > MAX_SOURCE_BYTES) {
      errorMessage.value = 'That file is larger than 25MB. Use a smaller photo.';
      status.value = 'error';
      return;
    }
    if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
      errorMessage.value = `${file.type} is not a supported image format. Use JPEG, PNG or WebP.`;
      status.value = 'error';
      return;
    }
    try {
      source.value?.close();
      source.value = await createImageBitmap(file);
    } catch {
      errorMessage.value = 'That image could not be decoded. Try exporting it as a JPEG first.';
      status.value = 'error';
      return;
    }
    await process();
  }

  function reset(): void {
    revokeUrls();
    source.value?.close();
    source.value = null;
    result.value = null;
    sheetCount.value = 0;
    errorMessage.value = '';
    status.value = 'idle';
  }

  return {
    status, errorMessage, backgroundIndex, backgroundColors, result, photoUrl, sheetUrl, sheetCount,
    isBusy, blockingFindings, warnings, acceptFile, process, reset,
  };
}
