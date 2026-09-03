import { defineMiddleware } from 'astro:middleware';
import { defaultLocale, isLocale } from './i18n/config';
import { detectLocale } from './i18n/detect-locale';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Root path: detect language and redirect
  if (pathname === '/') {
    const locale = detectLocale(context.request.headers.get('accept-language'));
    // No trailing slash: `trailingSlash: 'never'` + `build.format: 'file'`
    // serve the locale home at `/en-US`, so `/en-US/` costs a hop or 404s.
    return context.redirect(`/${locale}`, 302);
  }

  // Check if path starts with a valid locale
  const [, pathnameLocale = ''] = pathname.split('/');
  if (isLocale(pathnameLocale)) {
    context.locals.locale = pathnameLocale;
    return next();
  }

  // No locale prefix: redirect to default with path preserved
  return context.redirect(`/${defaultLocale}${pathname}`, 301);
});
