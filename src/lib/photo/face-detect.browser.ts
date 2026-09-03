import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * Face measurements a landmark model can actually provide.
 *
 * `crownY` is deliberately absent: landmark models stop at the hairline and
 * cannot see hair above it. The crown is read from the segmentation mask instead
 * (see `crown.ts`), and the two are combined in the pipeline.
 */
export interface PartialFaceMetrics {
  readonly chinY: number;
  readonly eyeY: number;
  readonly faceCentreX: number;
}

export interface FaceDetectorAssets {
  /** Directory holding the MediaPipe vision WASM bundle. */
  readonly wasmBasePath: string;
  /** URL of `face_landmarker.task`. */
  readonly modelPath: string;
}

export const DEFAULT_FACE_ASSETS: FaceDetectorAssets = {
  wasmBasePath: '/wasm/mediapipe',
  modelPath: '/models/face_landmarker.task',
};

/** Menton, the lowest point of the chin. */
const LANDMARK_CHIN = 152;
/** Iris centres, present only when the model returns all 478 points. */
const LANDMARK_LEFT_IRIS = 468;
const LANDMARK_RIGHT_IRIS = 473;
/** Outer and inner eye corners, the fallback when iris points are missing. */
const LANDMARK_LEFT_EYE_CORNERS = [33, 133] as const;
const LANDMARK_RIGHT_EYE_CORNERS = [362, 263] as const;

export interface FaceDetector {
  detect(image: ImageBitmap | HTMLCanvasElement | HTMLImageElement): Promise<PartialFaceMetrics | null>;
  close(): void;
}

type NormalisedPoint = { x: number; y: number };

function averagePoint(points: readonly NormalisedPoint[]): NormalisedPoint {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function pick(landmarks: readonly NormalisedPoint[], indices: readonly number[]): NormalisedPoint[] {
  const out: NormalisedPoint[] = [];
  for (const i of indices) {
    const point = landmarks[i];
    if (point) out.push(point);
  }
  return out;
}

/** Eye centre from iris landmarks when available, otherwise from the eye corners. */
function eyeCentre(landmarks: readonly NormalisedPoint[]): NormalisedPoint | null {
  const irises = pick(landmarks, [LANDMARK_LEFT_IRIS, LANDMARK_RIGHT_IRIS]);
  if (irises.length === 2) return averagePoint(irises);

  const corners = [
    ...pick(landmarks, LANDMARK_LEFT_EYE_CORNERS),
    ...pick(landmarks, LANDMARK_RIGHT_EYE_CORNERS),
  ];
  return corners.length === 4 ? averagePoint(corners) : null;
}

/**
 * Load the MediaPipe face landmarker.
 *
 * The model and WASM bundle are served from this origin rather than a CDN: a
 * cross-origin request would leak that a visitor is making a passport photo,
 * which contradicts the promise the rest of the pipeline keeps.
 */
export async function createFaceDetector(
  assets: FaceDetectorAssets = DEFAULT_FACE_ASSETS,
): Promise<FaceDetector> {
  const vision = await FilesetResolver.forVisionTasks(assets.wasmBasePath);
  const landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: assets.modelPath, delegate: 'GPU' },
    runningMode: 'IMAGE',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });

  return {
    async detect(image) {
      const width = 'width' in image ? Number(image.width) : 0;
      const height = 'height' in image ? Number(image.height) : 0;
      if (!width || !height) return null;

      const result = landmarker.detect(image);
      const landmarks = result.faceLandmarks?.[0];
      if (!landmarks || landmarks.length === 0) return null;

      const chin = landmarks[LANDMARK_CHIN];
      const eyes = eyeCentre(landmarks);
      if (!chin || !eyes) return null;

      return {
        chinY: chin.y * height,
        eyeY: eyes.y * height,
        faceCentreX: eyes.x * width,
      };
    },
    close() {
      landmarker.close();
    },
  };
}
