export const languages = {
  'de-DE': { name: 'Deutsch', dir: 'ltr' },
  'en-US': { name: 'English', dir: 'ltr' },
  'es-ES': { name: 'Español', dir: 'ltr' },
  'fr-FR': { name: 'Français', dir: 'ltr' },
  'it-IT': { name: 'Italiano', dir: 'ltr' },
  'ja-JP': { name: '日本語', dir: 'ltr' },
  'ko-KR': { name: '한국어', dir: 'ltr' },
  'nl-NL': { name: 'Nederlands', dir: 'ltr' },
  'pt-PT': { name: 'Português', dir: 'ltr' },
  'zh-CN': { name: '简体中文', dir: 'ltr' },
  'zh-TW': { name: '繁體中文', dir: 'ltr' },
} as const;

export type Locale = keyof typeof languages;

export const defaultLocale: Locale = 'en-US';

export const locales = Object.keys(languages) as Locale[];
