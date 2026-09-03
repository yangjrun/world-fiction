import type { Locale } from './config';

const translations = {
  'en-US': () => import('./translations/en-US.json').then(m => m.default),
  'zh-CN': () => import('./translations/en-US.json').then(m => m.default), // Fallback to English for now
  'ja-JP': () => import('./translations/en-US.json').then(m => m.default),
  'de-DE': () => import('./translations/en-US.json').then(m => m.default),
  'es-ES': () => import('./translations/en-US.json').then(m => m.default),
  'fr-FR': () => import('./translations/en-US.json').then(m => m.default),
  'it-IT': () => import('./translations/en-US.json').then(m => m.default),
  'ko-KR': () => import('./translations/en-US.json').then(m => m.default),
  'nl-NL': () => import('./translations/en-US.json').then(m => m.default),
  'pt-PT': () => import('./translations/en-US.json').then(m => m.default),
  'zh-TW': () => import('./translations/en-US.json').then(m => m.default),
} as const;

export async function getTranslations(locale: Locale): Promise<Record<string, string>> {
  const loader = translations[locale] || translations['en-US'];
  return await loader();
}

export function useTranslations(locale: Locale) {
  let dict: Record<string, string> = {};

  return {
    async load() {
      dict = await getTranslations(locale);
    },
    t(key: string, params?: Record<string, string>): string {
      let text = dict[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, v);
        });
      }
      return text;
    }
  };
}
