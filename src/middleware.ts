import { defineMiddleware } from 'astro:middleware';
import { locales, defaultLocale } from './i18n/config';

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Root path: detect language and redirect
  if (pathname === '/') {
    const locale = detectLocale(context.request.headers.get('accept-language'));
    return context.redirect(`/${locale}/`, 302);
  }

  // Check if path starts with a valid locale
  const pathnameLocale = pathname.split('/')[1];
  if (locales.includes(pathnameLocale as any)) {
    context.locals.locale = pathnameLocale;
    return next();
  }

  // No locale prefix: redirect to default with path preserved
  return context.redirect(`/${defaultLocale}${pathname}`, 301);
});

function detectLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.trim(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Try exact match first (e.g., zh-CN)
  for (const { code } of languages) {
    if (locales.includes(code as any)) return code;
  }

  // Try language-only match (e.g., zh -> zh-CN)
  for (const { code } of languages) {
    const lang = code.split('-')[0];
    const match = locales.find(l => l.startsWith(lang + '-'));
    if (match) return match;
  }

  return defaultLocale;
}
