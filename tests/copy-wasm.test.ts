import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { expect, it } from 'vitest';

it.each([false, true])('copies only the WASM backend and its loader (stale assets: %s)', (withStaleAssets) => {
  const root = mkdtempSync(join(tmpdir(), 'photo-wasm-'));
  const write = (path: string, content: string) => {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  };

  try {
    mkdirSync(join(root, 'scripts'));
    copyFileSync(new URL('../scripts/copy-wasm.mjs', import.meta.url), join(root, 'scripts/copy-wasm.mjs'));

    write('node_modules/onnxruntime-web/package.json', JSON.stringify({ main: 'dist/ort.node.min.js' }));
    write('node_modules/onnxruntime-web/dist/ort.node.min.js', '');
    // The /wasm entry needs the plain runtime; the root entry would need JSEP.
    const ortFiles = [
      'ort-wasm-simd-threaded.mjs',
      'ort-wasm-simd-threaded.wasm',
    ];
    const unusedOrtFiles = [
      'ort-wasm-simd-threaded.jsep.mjs',
      'ort-wasm-simd-threaded.jsep.wasm',
      'ort-wasm-simd-threaded.jspi.mjs',
      'ort-wasm-simd-threaded.jspi.wasm',
      'ort-wasm-simd-threaded.asyncify.mjs',
      'ort-wasm-simd-threaded.asyncify.wasm',
    ];
    for (const name of [...ortFiles, ...unusedOrtFiles]) write(`node_modules/onnxruntime-web/dist/${name}`, name);
    if (withStaleAssets) {
      for (const name of unusedOrtFiles) write(`public/wasm/ort/${name}`, 'stale runtime');
    }
    write('node_modules/onnxruntime-web/dist/ort.bundle.min.mjs', 'not a runtime loader');
    write('node_modules/onnxruntime-web/dist/ort.bundle.min.mjs.map', 'not a runtime loader');

    write('node_modules/@mediapipe/tasks-vision/package.json', JSON.stringify({ main: 'vision_bundle.cjs' }));
    write('node_modules/@mediapipe/tasks-vision/vision_bundle.cjs', '');
    const mediapipeFiles = ['vision_wasm_internal.js', 'vision_wasm_internal.wasm'];
    for (const name of mediapipeFiles) write(`node_modules/@mediapipe/tasks-vision/wasm/${name}`, name);
    write('public/models/face_landmarker.task', 'model fixture');
    write('public/models/u2netp.onnx', 'model fixture');

    execFileSync(process.execPath, [join(root, 'scripts/copy-wasm.mjs')], { cwd: root });

    for (const [directory, files] of [['ort', ortFiles], ['mediapipe', mediapipeFiles]] as const) {
      const destination = join(root, 'public/wasm', directory);
      expect(readdirSync(destination).sort()).toEqual([...files].sort());
      for (const name of files) expect(readFileSync(join(destination, name), 'utf8')).toBe(name);
    }

    // A partial dependency installation must fail the build, even if an old
    // public copy could otherwise hide the missing loader.
    rmSync(join(root, 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs'));
    expect(() => execFileSync(process.execPath, [join(root, 'scripts/copy-wasm.mjs')], {
      cwd: root,
      stdio: 'pipe',
    })).toThrow();
  } finally {
    // Only remove the temporary project allocated above.
    if (dirname(root) === tmpdir()) rmSync(root, { recursive: true, force: true });
  }
});
