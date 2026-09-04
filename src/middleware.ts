import { defineMiddleware } from 'astro:middleware';
import { defaultLocale, isLocale } from './i18n/config';
import { toRoutePath } from './i18n/paths';

export const onRequest = defineMiddleware((context, next) => {
  // `build.format: 'file'` makes the prerenderer pass the file path, not the
  // published URL, so a locale home page arrives as `/en-US.html` and the apex
  // page as `/index.html`. Normalise once, here: otherwise
  // `isLocale('en-US.html')` is false, the page looks unprefixed, and it is
  // replaced by a redirect stub pointing at `/en-US/en-US.html`. The redirect
  // target below uses the same normalised path so `/about.html` lands on
  // `/en-US/about` rather than on `/en-US/about.html`.
  const route = toRoutePath(context.url.pathname);

  // The apex page owns `/`. There is no adapter and no `output` setting, so this
  // middleware runs only at build time: `context.request` carries no visitor's
  // `accept-language` and a redirect here could resolve to one language for
  // everyone, baked into `dist/index.html`. Worse, it would beat
  // `src/pages/index.astro` to the route and leave a redirect stub where the
  // language chooser should be. Detection belongs in the browser, and that page
  // does it; let `/` through.
  if (route === '/') return next();

  // Check if path starts with a valid locale
  const [, pathnameLocale = ''] = route.split('/');
  if (isLocale(pathnameLocale)) {
    context.locals.locale = pathnameLocale;
    return next();
  }

  // No locale prefix: redirect to default with path preserved
  return context.redirect(`/${defaultLocale}${route}`, 301);
});
