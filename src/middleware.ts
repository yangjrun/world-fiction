import { defineMiddleware } from 'astro:middleware';
import { defaultLocale, isLocale } from './i18n/config';
import { detectLocale } from './i18n/detect-locale';
import { stripHtmlExtension } from './i18n/paths';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Root path: detect language and redirect
  if (pathname === '/') {
    const locale = detectLocale(context.request.headers.get('accept-language'));
    // No trailing slash: `trailingSlash: 'never'` + `build.format: 'file'`
    // serve the locale home at `/en-US`, so `/en-US/` costs a hop or 404s.
    return context.redirect(`/${locale}`, 302);
  }

  // `build.format: 'file'` makes the prerenderer pass the file path, so a locale
  // home page arrives as `/en-US.html`. Parse the extension-free path: otherwise
  // `isLocale('en-US.html')` is false, the page looks unprefixed, and it is
  // replaced by a redirect stub pointing at `/en-US/en-US.html`. The redirect
  // target below uses the same normalised path so `/about.html` lands on
  // `/en-US/about` rather than on `/en-US/about.html`.
  const route = stripHtmlExtension(pathname);

  // Check if path starts with a valid locale
  const [, pathnameLocale = ''] = route.split('/');
  if (isLocale(pathnameLocale)) {
    context.locals.locale = pathnameLocale;
    return next();
  }

  // No locale prefix: redirect to default with path preserved
  return context.redirect(`/${defaultLocale}${route}`, 301);
});
