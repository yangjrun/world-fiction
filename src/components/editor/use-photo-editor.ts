import { computed, ref, shallowRef } from 'vue';
import type { Locale } from '@/i18n/config';
import type { Translate } from '@/lib/spec-labels';
import { createFaceDetector, type FaceDetector } from '@/lib/photo/face-detect.browser';
import { createPersonSegmenter, type PersonSegmenter } from '@/lib/photo/background.browser';
import { mattingModelById } from '@/lib/photo/matting-model';
import { runPipeline, type PhotoResult, type PipelineOutcome } from '@/lib/photo/pipeline.browser';
import { SHEET_6X4_IN, planPrintSheet } from '@/lib/photo/sheet';
import { encodeCanvas, renderPrintSheet } from '@/lib/photo/render.browser';
import { resolvePhysicalSize, resolvePixelSize } from '@/lib/photo/units';
import type { PhotoSpec } from '@/lib/photo/types';
import type { Finding } from '@/lib/photo/validate';

export type EditorStatus = 'idle' | 'loading-models' | 'processing' | 'done' | 'error';

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Turn a pipeline failure into something a person can act on. */
function describeFailure(outcome: Extract<PipelineOutcome, { ok: false }>, locale: Locale, t: Translate): string {
  switch (outcome.reason) {
    case 'no-face':
    case 'no-subject':
    case 'invalid-face-metrics':
      return t(`editor.error.${outcome.reason}`);
    case 'insufficient-margin': {
      const edges = Object.entries(outcome.overflow)
        .filter(([, px]) => px > 0)
        .map(([edge]) => t(`editor.edge.${edge}`));
      return t('editor.error.insufficient-margin', {
        edges: new Intl.ListFormat(locale).format(edges),
      });
    }
    case 'cannot-meet-byte-budget':
      return t('editor.error.cannot-meet-byte-budget', {
        limit: `${new Intl.NumberFormat(locale).format(Math.round(outcome.maxBytes / 1024))} ${t('unit.kb')}`,
      });
  }
}

export function usePhotoEditor(spec: PhotoSpec, mattingModelId: string, locale: Locale, t: Translate) {
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

  const number = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, {
    style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
  const kb = (bytes: number): string => `${number.format(Math.round(bytes / 1024))} ${t('unit.kb')}`;

  function describeFinding(finding: Finding, photo: PhotoResult): string {
    switch (finding.code) {
      case 'dimensions.mismatch': {
        const expected = resolvePixelSize(spec.output);
        return t('editor.finding.dimensions.mismatch', {
          expectedWidth: String(expected.widthPx),
          expectedHeight: String(expected.heightPx),
          actualWidth: String(photo.plan.outputWidthPx),
          actualHeight: String(photo.plan.outputHeightPx),
        });
      }
      case 'head.out-of-range':
        return t('editor.finding.head.out-of-range', {
          actual: percent.format(photo.plan.achievedHeadRatio),
          documentName: spec.documentName,
          min: percent.format(spec.headHeight.minRatio),
          max: percent.format(spec.headHeight.maxRatio),
        });
      case 'eyeline.out-of-range':
        if (!spec.eyeLine) break;
        return t('editor.finding.eyeline.out-of-range', {
          actual: percent.format(photo.plan.achievedEyeRatioFromBottom),
          min: percent.format(spec.eyeLine.minRatio),
          max: percent.format(spec.eyeLine.maxRatio),
        });
      case 'file.too-large':
        if (spec.file.maxBytes === undefined) break;
        return t('editor.finding.file.too-large', { size: kb(photo.bytes), limit: kb(spec.file.maxBytes) });
      case 'file.too-small':
        if (spec.file.minBytes === undefined) break;
        return t('editor.finding.file.too-small', { size: kb(photo.bytes), limit: kb(spec.file.minBytes) });
    }
    return finding.message;
  }

  const backgroundColors = computed(() => spec.background.colors);
  const isBusy = computed(() => status.value === 'loading-models' || status.value === 'processing');
  const findings = computed(() => {
    const photo = result.value;
    return photo?.findings.map((finding) => ({ ...finding, message: describeFinding(finding, photo) })) ?? [];
  });
  const blockingFindings = computed(() => findings.value.filter((f) => f.severity === 'error'));
  const warnings = computed(() => findings.value.filter((f) => f.severity === 'warning'));

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
      status.value = 'processing';
      const outcome = await runPipeline(
        { detector: detector.value!, segmenter: segmenter.value! },
        { image, spec, backgroundColorIndex: backgroundIndex.value },
      );
      if (!outcome.ok) {
        result.value = null;
        errorMessage.value = describeFailure(outcome, locale, t);
        status.value = 'error';
        return;
      }
      result.value = outcome.result;
      photoUrl.value = URL.createObjectURL(outcome.result.blob);
      await buildSheet(outcome.result.canvas);
      status.value = 'done';
    } catch (cause) {
      result.value = null;
      console.error('Photo processing failed', cause);
      errorMessage.value = t('editor.error.processing');
      status.value = 'error';
    }
  }

  async function acceptFile(file: File): Promise<void> {
    errorMessage.value = '';
    if (file.size > MAX_SOURCE_BYTES) {
      errorMessage.value = t('editor.error.file-too-large');
      status.value = 'error';
      return;
    }
    if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
      errorMessage.value = t('editor.error.unsupported-format', { type: file.type });
      status.value = 'error';
      return;
    }
    try {
      source.value?.close();
      source.value = await createImageBitmap(file);
    } catch {
      errorMessage.value = t('editor.error.decode');
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
