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
 * The middleware touches only `url`, `request.headers`, `locals` and
 * `redirect`, so a recording stub is enough and keeps the assertions explicit.
 */
function createStub(pathname: string, acceptLanguage?: string): Stub {
  const url = new URL(pathname, ORIGIN);
  const redirects: RedirectRecord[] = [];
  const locals: { locale?: string } = {};

  const stub = {
    url,
    request: new Request(url, {
      headers: acceptLanguage === undefined ? undefined : { 'accept-language': acceptLanguage },
    }),
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
  it('redirects the root to the detected locale with no trailing slash', async () => {
    const { context, redirects } = createStub('/', 'zh-CN');
    const next = createNext();

    await onRequest(context, next);

    expect(redirects).toEqual([{ path: '/zh-CN', status: 302 }]);
    expect(redirects[0]?.path).not.toMatch(/\/$/);
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects the root to the default locale when no language is offered', async () => {
    const { context, redirects } = createStub('/');

    await onRequest(context, createNext());

    expect(redirects).toEqual([{ path: '/en-US', status: 302 }]);
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
});
