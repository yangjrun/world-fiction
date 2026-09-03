import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

/**
 * Copy the WASM runtimes into `public/` so they are served from this origin.
 *
 * A CDN would be less work, but it would also tell a third party that a given
 * visitor is making a passport photo, which contradicts the promise the rest of
 * the pipeline keeps. Runs before every build so a deploy cannot silently ship
 * without them.
 */
const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Copy every file matching `predicate` from one directory into another. */
async function copyMatching(fromDir, toDir, predicate) {
  await mkdir(toDir, { recursive: true });
  const entries = await readdir(fromDir, { withFileTypes: true });
  let copied = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !predicate(entry.name)) continue;
    await cp(join(fromDir, entry.name), join(toDir, entry.name));
    copied += 1;
  }
  return copied;
}

/**
 * Find a directory named `name` at or above `from`.
 *
 * Neither package exports its `package.json`, so the package root cannot be
 * resolved directly and the depth of the main entry varies between versions
 * (`<pkg>/vision_bundle.cjs` for mediapipe, `<pkg>/dist/ort.node.min.js` for
 * onnxruntime). Walking up a few levels is version-independent.
 */
async function findDirUp(from, name, maxLevels = 4) {
  let current = from;
  for (let level = 0; level < maxLevels; level += 1) {
    const candidate = join(current, name);
    if (await exists(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

async function main() {
  const ortDir = dirname(require.resolve('onnxruntime-web'));
  const ortCopied = await copyMatching(ortDir, join(root, 'public/wasm/ort'), (name) => name.endsWith('.wasm'));

  const mediapipeWasm = await findDirUp(dirname(require.resolve('@mediapipe/tasks-vision')), 'wasm');
  const mediapipeCopied = mediapipeWasm
    ? await copyMatching(mediapipeWasm, join(root, 'public/wasm/mediapipe'), () => true)
    : 0;

  console.log(`copy-wasm: ${ortCopied} onnxruntime file(s), ${mediapipeCopied} mediapipe file(s)`);

  if (ortCopied === 0 || mediapipeCopied === 0) {
    throw new Error('copy-wasm: expected runtime files in both directories; check the package layout');
  }

  const models = join(root, 'public/models');
  for (const required of ['face_landmarker.task', 'u2netp.onnx']) {
    if (!(await exists(join(models, required)))) {
      console.warn(
        `copy-wasm: public/models/${required} is missing. The editor will fail at runtime until you ` +
          'fetch it; see public/models/README.md.',
      );
    }
  }
}

await main();
