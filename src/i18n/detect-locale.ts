import { locales, defaultLocale, isLocale } from './config';
import type { Locale } from './config';

export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code = '', q = '1'] = lang.trim().split(';q=');
      return { code: code.trim(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Try exact match first (e.g., zh-CN)
  for (const { code } of languages) {
    if (isLocale(code)) return code;
  }

  // Try language-only match (e.g., zh -> zh-CN)
  for (const { code } of languages) {
    const [lang = ''] = code.split('-');
    const match = locales.find(l => l.startsWith(lang + '-'));
    if (match) return match;
  }

  return defaultLocale;
}
