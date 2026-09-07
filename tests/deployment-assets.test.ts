import { createHash } from 'node:crypto';
import { mkdtemp, open, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureModel } from '../scripts/setup-models.mjs';
import { checkPages, requireSiteUrl } from '../scripts/check-pages.mjs';

let directory: string;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'photo-deploy-')); });
afterEach(async () => {
  if (dirname(resolve(directory)) === resolve(tmpdir())) await rm(directory, { recursive: true, force: true });
});

const bytes = Buffer.from('a complete model fixture');
const model = {
  name: 'fixture.onnx',
  url: 'https://models.example.org/fixture.onnx',
  sha256: createHash('sha256').update(bytes).digest('hex'),
};

describe('model preparation', () => {
  it('downloads and verifies a missing model, then reuses it without a network request', async () => {
    const fetchModel = vi.fn(async () => new Response(bytes));
    expect(await ensureModel(directory, model, fetchModel)).toBe('downloaded');
    expect(await readFile(join(directory, model.name))).toEqual(bytes);
    expect(await ensureModel(directory, model, fetchModel)).toBe('verified');
    expect(fetchModel).toHaveBeenCalledTimes(1);
  });

  it('rejects changed local weights without overwriting them', async () => {
    await writeFile(join(directory, model.name), 'custom model');
    const fetchModel = vi.fn();
    await expect(ensureModel(directory, model, fetchModel)).rejects.toThrow('SHA-256 mismatch');
    expect(fetchModel).not.toHaveBeenCalled();
    expect(await readFile(join(directory, model.name), 'utf8')).toBe('custom model');
  });

  it('does not save a response with the wrong checksum', async () => {
    await expect(ensureModel(directory, model, async () => new Response('truncated model')))
      .rejects.toThrow('SHA-256 mismatch');
    expect(await readdir(directory)).toEqual([]);
  });

  it('does not save an HTTP error page as a model', async () => {
    await expect(ensureModel(directory, model, async () => new Response('not found', { status: 404 })))
      .rejects.toThrow('HTTP 404');
    expect(await readdir(directory)).toEqual([]);
  });
});

describe('Pages deployment checks', () => {
  it('rejects an asset that exceeds the single-file limit', async () => {
    const asset = await open(join(directory, 'oversized.wasm'), 'w');
    try { await asset.truncate(25 * 1024 * 1024 + 1); }
    finally { await asset.close(); }
    await expect(checkPages(directory)).rejects.toThrow('25 MiB file limit exceeded: oversized.wasm');
  });

  it.each([undefined, '', 'http://photos.acme.org', 'https://example.com', 'https://localhost',
    'https://photos.acme.org/tool', 'https://photos.acme.org/?q=1', 'https://user:password@photos.acme.org'])
  ('rejects an invalid public site address: %s', (value) => {
    expect(() => requireSiteUrl(value)).toThrow('SITE_URL');
  });

  it('accepts a custom domain or the assigned Pages origin', () => {
    expect(requireSiteUrl('https://photos.acme.org/')).toBe('https://photos.acme.org');
    expect(requireSiteUrl('https://passport-photo-tools.pages.dev')).toBe('https://passport-photo-tools.pages.dev');
  });
});
