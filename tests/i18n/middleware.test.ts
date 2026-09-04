import { describe, expect, it, vi } from 'vitest';

import type { APIContext, MiddlewareNext } from 'astro';

import { onRequest } from '@/middleware';

const ORIGIN = 'https://example.test';

interface RedirectRecord {
  readonly path: string;
  readonly status: number;
}

interface Stub {
  readonly context: APIContext;
  readonly redirects: readonly RedirectRecord[];
  readonly locals: { locale?: string };
}

/**
 * The middleware touches only `url`, `locals` and `redirect` — the root branch
 * that read `request.headers` is gone, because a static build has no request to
 * read — so a recording stub is enough and keeps the assertions explicit.
 */
function createStub(pathname: string): Stub {
  const url = new URL(pathname, ORIGIN);
  const redirects: RedirectRecord[] = [];
  const locals: { locale?: string } = {};

  const stub = {
    url,
    locals,
    redirect: (path: string, status = 302) => {
      redirects.push({ path, status });
      return new Response(null, { status, headers: { location: path } });
    },
  };

  return { context: stub as unknown as APIContext, redirects, locals };
}

function createNext(): MiddlewareNext {
  return vi.fn(async () => new Response('ok')) as unknown as MiddlewareNext;
}

describe('i18n middleware', () => {
  // The apex page owns `/` now: this build is fully static, so a redirect here
  // could only bake one language into `dist/index.html` for every visitor, and
  // it would beat `src/pages/index.astro` to the route. The two 302 tests that
  // used to stand here asserted that redirect and were deleted with it.
  it('lets the root through so the apex page can render', async () => {
    const { context, redirects } = createStub('/');
    const next = createNext();

    await onRequest(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(redirects).toEqual([]);
  });

  it('lets the prerendered apex page through as /index.html', async () => {
    // The decisive case. `build.format: 'file'` hands the middleware
    // `/index.html`, which `pathname === '/'` misses and `isLocale('index')`
    // rejects, so the missing-prefix branch below used to 301 it to
    // `/en-US/index` — a route with nothing behind it — and `dist/index.html`
    // shipped as a ~330-byte redirect stub instead of the language chooser.
    const { context, redirects } = createStub('/index.html');
    const next = createNext();

    await onRequest(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(redirects).toEqual([]);
  });

  it('redirects an unprefixed path to the default locale, preserving the path', async () => {
    const { context, redirects } = createStub('/about');
    const next = createNext();

    await onRequest(context, next);

    expect(redirects).toEqual([{ path: '/en-US/about', status: 301 }]);
    expect(next).not.toHaveBeenCalled();
  });

  it('treats an unrecognised locale prefix as an unprefixed path', async () => {
    const { context, redirects } = createStub('/xx-YY/about');
    const next = createNext();

    await onRequest(context, next);

    expect(redirects).toEqual([{ path: '/en-US/xx-YY/about', status: 301 }]);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes a validly prefixed path through and records the locale', async () => {
    const { context, redirects, locals } = createStub('/zh-CN/about');
    const next = createNext();

    await onRequest(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(locals.locale).toBe('zh-CN');
    expect(redirects).toEqual([]);
  });

  it('passes the default locale prefix through as well', async () => {
    const { context, locals } = createStub('/en-US');
    const next = createNext();

    await onRequest(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(locals.locale).toBe('en-US');
  });

  // `build.format: 'file'` means the prerenderer passes the file path, not the
  // published URL, so these are the paths the middleware actually sees at build
  // time. Reading the locale out of the unnormalised path made
  // `isLocale('en-US.html')` false: the locale home page looked unprefixed and
  // every one of them was replaced by a redirect stub to `/en-US/en-US.html`.
  it('passes a prerendered locale home page through, extension and all', async () => {
    const { context, redirects, locals } = createStub('/en-US.html');
    const next = createNext();

    await onRequest(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(locals.locale).toBe('en-US');
    expect(redirects).toEqual([]);
  });

  it('passes a prerendered nested page through', async () => {
    const { context, redirects, locals } = createStub('/zh-CN/about.html');
    const next = createNext();

    await onRequest(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(locals.locale).toBe('zh-CN');
    expect(redirects).toEqual([]);
  });

  it('reads the locale out of a prerendered nested index page', async () => {
    // `build.format: 'file'` produces no such path today (the locale home is
    // `dist/en-US.html`), but the normalisation that lets `/index.html` reach the
    // apex must not swallow the locale when the index sits under one.
    const { context, redirects, locals } = createStub('/en-US/index.html');
    const next = createNext();

    await onRequest(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(locals.locale).toBe('en-US');
    expect(redirects).toEqual([]);
  });

  it('strips the extension from the missing-prefix redirect target', async () => {
    // `/en-US/about.html` would send the reader to a URL shape the site does not
    // publish, and it is the shape that leaks on into canonical and hreflang.
    const { context, redirects } = createStub('/about.html');
    const next = createNext();

    await onRequest(context, next);

    expect(redirects).toEqual([{ path: '/en-US/about', status: 301 }]);
    expect(redirects[0]?.path).not.toMatch(/\.html$/);
    expect(next).not.toHaveBeenCalled();
  });
});
