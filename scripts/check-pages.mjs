import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { MODELS, verifyModel } from './setup-models.mjs';

export function requireSiteUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Set SITE_URL to the public HTTPS origin before running build:pages.');
  }
  if (
    url.protocol !== 'https:' || url.username || url.password || url.port ||
    url.pathname !== '/' || url.search || url.hash ||
    ['example.com', 'www.example.com', 'localhost'].includes(url.hostname)
  ) {
    throw new Error('SITE_URL must be your public HTTPS origin, without a path, query, or placeholder domain.');
  }
  return url.origin;
}

export async function checkPages(directory) {
  const files = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push({ path, bytes: (await stat(path)).size });
      else throw new Error(`Unsupported deployment entry: ${relative(directory, path)}`);
    }
  }
  await walk(directory);

  const oversized = files.filter(file => file.bytes > 25 * 1024 * 1024);
  if (oversized.length) {
    throw new Error(`Cloudflare Pages' 25 MiB file limit exceeded: ${oversized.map(file => relative(directory, file.path)).join(', ')}`);
  }
  if (files.length > 20_000) throw new Error(`Cloudflare Pages' 20,000 file limit exceeded: ${files.length}`);

  for (const file of [
    'index.html',
    'wasm/ort/ort-wasm-simd-threaded.mjs',
    'wasm/ort/ort-wasm-simd-threaded.wasm',
    'wasm/mediapipe/vision_wasm_internal.js',
    'wasm/mediapipe/vision_wasm_internal.wasm',
  ]) {
    if (!(await stat(join(directory, file))).size) throw new Error(`Empty deployment asset: ${file}`);
  }
  for (const model of MODELS) verifyModel(await readFile(join(directory, 'models', model.name)), model);

  return {
    files: files.length,
    totalMiB: files.reduce((total, file) => total + file.bytes, 0) / 1024 / 1024,
    largestMiB: Math.max(...files.map(file => file.bytes)) / 1024 / 1024,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.includes('--site')) {
      console.log(`check-pages: site ${requireSiteUrl(process.env.SITE_URL)}`);
    } else {
      const result = await checkPages(resolve(import.meta.dirname, '../dist'));
      console.log(`check-pages: ${result.files} files, ${result.totalMiB.toFixed(2)} MiB total, largest ${result.largestMiB.toFixed(2)} MiB (limit 25 MiB)`);
    }
  } catch (error) {
    console.error(`check-pages: ${error.message}`);
    process.exitCode = 1;
  }
}
