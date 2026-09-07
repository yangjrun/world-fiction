import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// These are the exact exports used by the editor. Pin hashes so a failed download
// or an upstream replacement cannot silently ship an incompatible model.
export const MODELS = [
  {
    name: 'face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    sha256: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
  },
  {
    name: 'u2netp.onnx',
    url: 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx',
    sha256: '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  },
];

export function verifyModel(bytes, model) {
  if (createHash('sha256').update(bytes).digest('hex') !== model.sha256) {
    throw new Error(`SHA-256 mismatch for ${model.name}; check its source before replacing the model or its pinned hash.`);
  }
}

export async function ensureModel(directory, model, fetchModel = globalThis.fetch) {
  const target = join(directory, model.name);
  let existing;
  try {
    existing = await readFile(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  if (existing !== undefined) {
    verifyModel(existing, model);
    return 'verified';
  }

  const response = await fetchModel(model.url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`Download failed for ${model.name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  verifyModel(bytes, model);
  await mkdir(directory, { recursive: true });
  // Write only after verifying the complete response. Never overwrite a model
  // that another build or the developer created while the download was running.
  await writeFile(target, bytes, { flag: 'wx' });
  return 'downloaded';
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const directory = resolve(import.meta.dirname, '../public/models');
    for (const model of MODELS) {
      console.log(`setup-models: ${model.name} ${await ensureModel(directory, model)}`);
    }
  } catch (error) {
    console.error(`setup-models: ${error.message}`);
    process.exitCode = 1;
  }
}
