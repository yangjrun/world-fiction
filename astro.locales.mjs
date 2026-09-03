// Build-time source of truth for the locale list. Deliberately literals only,
// with NO imports at all: astro.config.mjs loads this from inside Astro's config
// loader, and a specifier that failed to resolve there would stop every build.
//
// src/i18n/config.ts holds the runtime copy (with display names and direction).
// tests/i18n/astro-config.test.ts imports both modules and compares them by
// value, so the two cannot drift apart unnoticed.
export const LOCALES = ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-CN', 'zh-TW'];

export const DEFAULT_LOCALE = 'en-US';
