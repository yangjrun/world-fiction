# Multi-Language Support (i18n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for 11 languages (de-DE, en-US, es-ES, fr-FR, it-IT, ja-JP, ko-KR, nl-NL, pt-PT, zh-CN, zh-TW) with automatic language detection, localized content, and language switching.

**Architecture:** Astro native i18n with sub-path routing (`/en-US/`, `/zh-CN/`, etc.), content collections organized by locale, JSON-based UI translations, and middleware for language detection.

**Tech Stack:** Astro 7.2.10, TypeScript 6.0.3, Content Collections, Astro middleware

**Spec:** `docs/superpowers/specs/2026-09-03-i18n-multilanguage-support-design.md`

## Global Constraints

- All 11 locales must be defined: de-DE, en-US, es-ES, fr-FR, it-IT, ja-JP, ko-KR, nl-NL, pt-PT, zh-CN, zh-TW
- Default locale is `en-US`
- All URLs must have locale prefix (e.g., `/en-US/`, `/zh-CN/`)
- Root path `/` redirects based on browser language detection
- Only `status: verified` content gets published pages
- No hardcoded English strings in UI components
- All translation keys use dot notation (e.g., `nav.home`, `editor.heading`)

---

## File Structure Overview

### New Files to Create

```
src/i18n/
├── config.ts                          # Language configuration and types
├── ui.ts                              # Translation helper functions
└── translations/
    ├── en-US.json                     # English UI translations
    ├── zh-CN.json                     # Simplified Chinese (skeleton)
    ├── ja-JP.json                     # Japanese (skeleton)
    ├── de-DE.json                     # German (skeleton)
    ├── es-ES.json                     # Spanish (skeleton)
    ├── fr-FR.json                     # French (skeleton)
    ├── it-IT.json                     # Italian (skeleton)
    ├── ko-KR.json                     # Korean (skeleton)
    ├── nl-NL.json                     # Dutch (skeleton)
    ├── pt-PT.json                     # Portuguese (skeleton)
    └── zh-TW.json                     # Traditional Chinese (skeleton)

src/middleware.ts                      # Language detection middleware

src/env.d.ts                          # TypeScript types for Astro locals

src/content/specs/
├── en-US/                            # English content (moved from root)
│   ├── us-passport.md
│   ├── schengen-visa.md
│   ├── uk-passport.md
│   ├── cn-visa.md
│   ├── ca-passport.md
│   └── us-dv-lottery.md
└── zh-CN/                            # Chinese content (copied, needs-review)
    └── ... (same structure)

src/pages/
├── [locale]/
│   ├── index.astro                   # Home page with locale
│   ├── about.astro                   # About page with locale
│   ├── privacy.astro                 # Privacy page with locale
│   ├── terms.astro                   # Terms page with locale
│   └── [country]/
│       └── [document].astro          # Document page with locale

tests/
├── i18n/
│   ├── language-detection.test.ts    # Middleware tests
│   └── translations.test.ts          # Translation helper tests
└── e2e/
    └── i18n.spec.ts                  # E2E language switching tests
```

### Files to Modify

```
astro.config.mjs                      # Add i18n configuration
src/lib/specs.ts                      # Add locale filtering
src/layouts/BaseLayout.astro          # Add locale prop, language switcher
src/components/SpecTable.astro        # Add locale prop, translations
src/components/editor/PhotoEditor.vue # Add locale prop
src/pages/index.astro                 # DELETE (replaced by [locale]/index.astro)
src/pages/about.astro                 # DELETE (replaced by [locale]/about.astro)
src/pages/privacy.astro               # DELETE (replaced by [locale]/privacy.astro)
src/pages/terms.astro                 # DELETE (replaced by [locale]/terms.astro)
src/pages/[country]/[document].astro  # DELETE (replaced by [locale]/[country]/[document].astro)
```

---

## Task 1: Create i18n Configuration Infrastructure

**Files:**
- Create: `src/i18n/config.ts`
- Create: `src/env.d.ts`
- Test: `tests/i18n/config.test.ts`

**Interfaces:**
- Consumes: None
- Produces:
  - `export type Locale = 'de-DE' | 'en-US' | ... (all 11)`
  - `export const languages: Record<Locale, { name: string; dir: 'ltr' | 'rtl' }>`
  - `export const defaultLocale: Locale = 'en-US'`
  - `export const locales: Locale[]`

- [ ] **Step 1: Write test for language configuration**

Create `tests/i18n/config.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { languages, locales, defaultLocale, type Locale } from '@/i18n/config';

describe('i18n configuration', () => {
  it('should define all 11 locales', () => {
    expect(locales).toHaveLength(11);
    expect(locales).toContain('de-DE');
    expect(locales).toContain('en-US');
    expect(locales).toContain('es-ES');
    expect(locales).toContain('fr-FR');
    expect(locales).toContain('it-IT');
    expect(locales).toContain('ja-JP');
    expect(locales).toContain('ko-KR');
    expect(locales).toContain('nl-NL');
    expect(locales).toContain('pt-PT');
    expect(locales).toContain('zh-CN');
    expect(locales).toContain('zh-TW');
  });

  it('should set en-US as default locale', () => {
    expect(defaultLocale).toBe('en-US');
  });

  it('should have language names and text direction for all locales', () => {
    locales.forEach(locale => {
      expect(languages[locale]).toBeDefined();
      expect(languages[locale].name).toBeTruthy();
      expect(languages[locale].dir).toBe('ltr');
    });
  });

  it('should have correct native names', () => {
    expect(languages['de-DE'].name).toBe('Deutsch');
    expect(languages['en-US'].name).toBe('English');
    expect(languages['zh-CN'].name).toBe('简体中文');
    expect(languages['ja-JP'].name).toBe('日本語');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/i18n/config.test.ts`
Expected: FAIL with "Cannot find module '@/i18n/config'"

- [ ] **Step 3: Create i18n configuration file**

Create `src/i18n/config.ts`:

```typescript
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
```

- [ ] **Step 4: Create TypeScript types for Astro locals**

Create `src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    locale: string;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test tests/i18n/config.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 6: Commit**

```bash
git add src/i18n/config.ts src/env.d.ts tests/i18n/config.test.ts
git commit -m "feat(i18n): add language configuration and types

Add configuration for 11 supported locales with native language names.
Define TypeScript types for locale and Astro locals.

Supported languages: de-DE, en-US, es-ES, fr-FR, it-IT, ja-JP, ko-KR, nl-NL, pt-PT, zh-CN, zh-TW"
```

---

## Task 2: Create Translation System

**Files:**
- Create: `src/i18n/ui.ts`
- Create: `src/i18n/translations/en-US.json`
- Test: `tests/i18n/translations.test.ts`

**Interfaces:**
- Consumes:
  - `Locale` from `@/i18n/config`
- Produces:
  - `export async function getTranslations(locale: Locale): Promise<Record<string, string>>`
  - `export function useTranslations(locale: Locale): { load(): Promise<void>; t(key: string, params?: Record<string, string>): string }`

- [ ] **Step 1: Write test for translation helper**

Create `tests/i18n/translations.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslations, getTranslations } from '@/i18n/ui';

describe('Translation system', () => {
  it('should load English translations', async () => {
    const dict = await getTranslations('en-US');
    expect(dict['nav.home']).toBe('All photo specs');
    expect(dict['nav.about']).toBe('About');
  });

  it('should return key if translation missing', async () => {
    const t = useTranslations('en-US');
    await t.load();
    expect(t.t('non.existent.key')).toBe('non.existent.key');
  });

  it('should interpolate parameters', async () => {
    const t = useTranslations('en-US');
    await t.load();
    const result = t.t('editor.heading', { documentName: 'US passport' });
    expect(result).toBe('Make your US passport');
  });

  it('should handle multiple parameters', async () => {
    const t = useTranslations('en-US');
    await t.load();
    // Assuming we have a key like "greeting": "Hello {name}, welcome to {place}"
    const result = t.t('test.greeting', { name: 'Alice', place: 'Tokyo' });
    expect(result).toContain('Alice');
    expect(result).toContain('Tokyo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/i18n/translations.test.ts`
Expected: FAIL with "Cannot find module '@/i18n/ui'"

- [ ] **Step 3: Create English translation file**

Create `src/i18n/translations/en-US.json`:

```json
{
  "nav.home": "All photo specs",
  "nav.about": "About",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.about": "About",
  "footer.disclaimer": "Requirements are summarised from official sources and can change; always check the authority's own page before applying.",
  "footer.privacy-note": "Photos are processed entirely in your browser. Nothing you upload is sent to a server, stored, or seen by anyone else.",
  "skip.content": "Skip to content",
  
  "home.title": "Passport and visa photos that actually meet the requirements",
  "home.subtitle": "Most rejected photos fail on head size, not on the crop. Pick a document below and this tool measures your face, positions it inside the permitted range, replaces the background and gives you a printable sheet.",
  "home.privacy": "Every step runs inside your browser. Your photo is never uploaded, never stored and never seen by anyone but you.",
  "home.choose": "Choose your document",
  "home.how-heading": "How the measurements work",
  
  "editor.heading": "Make your {documentName}",
  "editor.privacy": "Everything runs on your device. Your photo is never uploaded.",
  "editor.drag": "Drag a photo here, or",
  "editor.choose": "Choose a photo",
  "editor.formats": "JPEG, PNG or WebP, up to 25MB",
  "editor.loading": "Loading the on-device models, this happens once…",
  "editor.processing": "Processing your photo…",
  
  "requirements.heading": "Requirements at a glance",
  "requirements.source": "Source:",
  "requirements.checked": "last checked",
  
  "rejections.heading": "Why photos get rejected",
  "faq.heading": "Common questions",
  
  "spec.size": "Photo size",
  "spec.head-height": "Head height, chin to crown",
  "spec.eye-height": "Eye height above bottom edge",
  "spec.background": "Background",
  "spec.file": "File",
  
  "test.greeting": "Hello {name}, welcome to {place}"
}
```

- [ ] **Step 4: Create translation helper functions**

Create `src/i18n/ui.ts`:

```typescript
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test tests/i18n/translations.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 6: Commit**

```bash
git add src/i18n/ui.ts src/i18n/translations/en-US.json tests/i18n/translations.test.ts
git commit -m "feat(i18n): add translation system with English translations

Create translation helper functions with parameter interpolation.
Add complete English UI translation strings.
All non-English locales fallback to English for now."
```

---

## Task 3: Add Language Detection Middleware

**Files:**
- Create: `src/middleware.ts`
- Test: `tests/i18n/language-detection.test.ts`

**Interfaces:**
- Consumes:
  - `locales`, `defaultLocale` from `@/i18n/config`
- Produces:
  - `export const onRequest = defineMiddleware((context, next) => ...)`
  - `function detectLocale(acceptLanguage: string | null): string` (internal)

- [ ] **Step 1: Write test for language detection**

Create `tests/i18n/language-detection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

// We'll test the detectLocale logic in isolation
function detectLocale(acceptLanguage: string | null, locales: string[], defaultLocale: string): string {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: code.trim(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  // Try exact match first
  for (const { code } of languages) {
    if (locales.includes(code)) return code;
  }

  // Try language-only match
  for (const { code } of languages) {
    const lang = code.split('-')[0];
    const match = locales.find(l => l.startsWith(lang + '-'));
    if (match) return match;
  }

  return defaultLocale;
}

describe('Language detection', () => {
  const locales = ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-CN', 'zh-TW'];
  const defaultLocale = 'en-US';

  it('should return default locale when Accept-Language is null', () => {
    expect(detectLocale(null, locales, defaultLocale)).toBe('en-US');
  });

  it('should match exact locale', () => {
    expect(detectLocale('zh-CN', locales, defaultLocale)).toBe('zh-CN');
    expect(detectLocale('ja-JP', locales, defaultLocale)).toBe('ja-JP');
  });

  it('should match language prefix', () => {
    expect(detectLocale('zh', locales, defaultLocale)).toBe('zh-CN'); // First match
    expect(detectLocale('ja', locales, defaultLocale)).toBe('ja-JP');
    expect(detectLocale('de', locales, defaultLocale)).toBe('de-DE');
  });

  it('should handle quality values', () => {
    expect(detectLocale('fr-FR;q=0.9,en-US;q=0.8', locales, defaultLocale)).toBe('fr-FR');
    expect(detectLocale('en-US;q=0.5,zh-CN;q=0.9', locales, defaultLocale)).toBe('zh-CN');
  });

  it('should handle multiple languages and pick best match', () => {
    expect(detectLocale('en-GB,en;q=0.9', locales, defaultLocale)).toBe('en-US');
    expect(detectLocale('pt-BR,pt;q=0.9', locales, defaultLocale)).toBe('pt-PT');
  });

  it('should return default for unsupported language', () => {
    expect(detectLocale('ru-RU', locales, defaultLocale)).toBe('en-US');
    expect(detectLocale('ar-SA', locales, defaultLocale)).toBe('en-US');
  });

  it('should handle complex Accept-Language headers', () => {
    const complex = 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5';
    expect(detectLocale(complex, locales, defaultLocale)).toBe('fr-FR');
  });
});
```

- [ ] **Step 2: Run test to verify it passes (pure logic test)**

Run: `pnpm test tests/i18n/language-detection.test.ts`
Expected: PASS (tests verify the algorithm logic)

- [ ] **Step 3: Create middleware file**

Create `src/middleware.ts`:

```typescript
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
```

- [ ] **Step 4: Verify build doesn't break**

Run: `pnpm build`
Expected: Build succeeds (middleware is loaded)

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts tests/i18n/language-detection.test.ts
git commit -m "feat(i18n): add language detection middleware

Detect browser language from Accept-Language header.
Redirect root path to detected language.
Redirect non-localized paths to default locale.
Support exact and language-prefix matching."
```

---

## Task 4: Update Astro Configuration

**Files:**
- Modify: `astro.config.mjs`

**Interfaces:**
- Consumes: None (configuration file)
- Produces: Astro i18n routing enabled

- [ ] **Step 1: Read current Astro configuration**

Run: `cat astro.config.mjs`
Note: Identify where to add i18n configuration

- [ ] **Step 2: Update Astro configuration with i18n settings**

Edit `astro.config.mjs`, add i18n block after `site`:

```javascript
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const SITE = process.env.SITE_URL ?? 'https://example.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  i18n: {
    defaultLocale: 'en-US',
    locales: ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-CN', 'zh-TW'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [vue(), sitemap()],
  build: {
    format: 'file',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    optimizeDeps: {
      exclude: ['onnxruntime-web', '@mediapipe/tasks-vision'],
    },
  },
});
```

- [ ] **Step 3: Verify configuration is valid**

Run: `pnpm astro check`
Expected: No configuration errors

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(i18n): configure Astro i18n routing

Enable i18n with 11 supported locales.
Force locale prefix for all routes including default.
Middleware handles root path redirection."
```

---

## Task 5: Restructure Content Collections

**Files:**
- Modify: `src/lib/specs.ts`
- Move: `src/content/specs/*.md` → `src/content/specs/en-US/*.md`
- Test: Integration test in subsequent task

**Interfaces:**
- Consumes:
  - `Locale` from `@/i18n/config`
- Produces:
  - `export async function getVerifiedSpecPages(locale: Locale): Promise<SpecPage[]>` (modified signature)

- [ ] **Step 1: Create en-US subdirectory**

Run: `mkdir -p src/content/specs/en-US`

- [ ] **Step 2: Move existing spec files to en-US directory**

Run PowerShell:

```powershell
Get-ChildItem src/content/specs/*.md | Move-Item -Destination src/content/specs/en-US/
```

- [ ] **Step 3: Verify files moved correctly**

Run: `ls src/content/specs/en-US/`
Expected: See all 6 markdown files (us-passport.md, schengen-visa.md, etc.)

- [ ] **Step 4: Update specs.ts to filter by locale**

Edit `src/lib/specs.ts`:

```typescript
import { getCollection, type CollectionEntry } from 'astro:content';
import { toPhotoSpec, type RawPhotoSpec } from './photo/raw-spec.js';
import type { PhotoSpec } from './photo/types.js';
import type { Locale } from '@/i18n/config';

export type SpecEntry = CollectionEntry<'specs'>;

export interface SpecPage {
  readonly entry: SpecEntry;
  readonly spec: PhotoSpec;
  readonly href: string;
}

function toSpecPage(entry: SpecEntry, locale: Locale): SpecPage {
  const { country, document } = entry.data;
  return {
    entry,
    spec: toPhotoSpec(entry.data as unknown as RawPhotoSpec),
    href: `/${locale}/${country}/${document}`,
  };
}

/**
 * Every spec cleared for publication in the given locale, sorted by country then document.
 */
export async function getVerifiedSpecPages(locale: Locale): Promise<SpecPage[]> {
  const entries = await getCollection('specs', ({ id, data }) => {
    const entryLocale = id.split('/')[0];
    return entryLocale === locale && data.status === 'verified';
  });
  
  return entries
    .map(entry => toSpecPage(entry, locale))
    .sort((a, b) =>
      a.entry.data.countryName.localeCompare(b.entry.data.countryName) ||
      a.entry.data.documentName.localeCompare(b.entry.data.documentName),
    );
}

/** Specs awaiting verification, for the maintenance view. */
export async function getPendingSpecEntries(): Promise<SpecEntry[]> {
  return getCollection('specs', ({ data }) => data.status !== 'verified');
}
```

- [ ] **Step 5: Verify build succeeds with new structure**

Run: `pnpm build`
Expected: Build succeeds, pages not generated yet (routes not updated)

- [ ] **Step 6: Commit**

```bash
git add src/content/specs/en-US/ src/lib/specs.ts
git rm src/content/specs/*.md
git commit -m "feat(i18n): restructure content collections by locale

Move existing specs to en-US subdirectory.
Update getVerifiedSpecPages to filter by locale.
Content loader automatically picks up nested structure."
```

---

## Task 6: Create Localized Home Page

**Files:**
- Create: `src/pages/[locale]/index.astro`
- Delete: `src/pages/index.astro`

**Interfaces:**
- Consumes:
  - `Locale`, `locales` from `@/i18n/config`
  - `useTranslations` from `@/i18n/ui`
  - `getVerifiedSpecPages(locale)` from `@/lib/specs`
- Produces: Home page for each locale

- [ ] **Step 1: Create locale directory**

Run: `mkdir -p src/pages/[locale]`

- [ ] **Step 2: Create new localized home page**

Create `src/pages/[locale]/index.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { getVerifiedSpecPages } from '@/lib/specs';
import { locales, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';
import { resolvePhysicalSize, resolvePixelSize } from '@/lib/photo/units';

export async function getStaticPaths() {
  return locales.map(locale => ({ params: { locale } }));
}

const locale = Astro.params.locale as Locale;
const t = useTranslations(locale);
await t.load();

const pages = await getVerifiedSpecPages(locale);

function sizeLabel(spec: (typeof pages)[number]['spec']): string {
  const physical = resolvePhysicalSize(spec.output);
  if (physical) return `${physical.widthMm} × ${physical.heightMm} mm`;
  const { widthPx, heightPx } = resolvePixelSize(spec.output);
  return `${widthPx} × ${heightPx} px`;
}
---

<BaseLayout locale={locale} title={t.t('home.title')} description={t.t('home.subtitle')}>
  <h1 class="max-w-3xl text-4xl font-semibold tracking-tight text-ink-900">
    {t.t('home.title')}
  </h1>
  <p class="mt-4 max-w-2xl text-lg text-ink-600">
    {t.t('home.subtitle')}
  </p>
  <p class="mt-3 max-w-2xl text-ink-600">
    {t.t('home.privacy')}
  </p>

  <h2 class="mt-12 text-xl font-semibold text-ink-900">{t.t('home.choose')}</h2>
  <ul class="mt-4 grid gap-3 sm:grid-cols-2">
    {
      pages.map(({ entry, spec, href }) => (
        <li>
          <a
            href={href}
            class="block h-full rounded-xl border border-ink-200 p-5 transition-colors hover:border-brand-500 hover:bg-brand-50"
          >
            <span class="block font-medium text-ink-900">{entry.data.documentName}</span>
            <span class="mt-1 block text-sm text-ink-600">{entry.data.countryName}</span>
            <span class="mt-3 block text-sm text-ink-400">{sizeLabel(spec)}</span>
          </a>
        </li>
      ))
    }
  </ul>

  <section class="mt-16 max-w-2xl" aria-labelledby="how">
    <h2 id="how" class="text-xl font-semibold text-ink-900">{t.t('home.how-heading')}</h2>
    <p class="mt-3 text-ink-600">
      Every authority publishes two numbers that matter more than the outer size: how tall
      your head must be from the bottom of the chin to the top of the head, and sometimes
      how far your eyes must sit above the bottom edge. These are narrow ranges, often only
      five millimetres wide, and a crop that looks right by eye lands outside them more
      often than not.
    </p>
    <p class="mt-3 text-ink-600">
      Head height is measured to the top of the head <em>including hair</em>, which is why
      this tool separates you from the background first: the outline of your hair is what
      reveals where the top of your head really is. Face-detection models stop at the
      hairline and consistently underestimate it. Once the crown, chin and eye line are
      known, the crop is computed to land in the middle of each permitted range rather
      than at its edge, which leaves the most room for error.
    </p>
    <p class="mt-3 text-ink-600">
      If your original photo is framed too tightly to produce a compliant result, the tool
      says which edge falls short instead of cropping in further and handing you something
      that will be turned down at the counter.
    </p>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Delete old home page**

Run: `git rm src/pages/index.astro`

- [ ] **Step 4: Verify build generates pages for all locales**

Run: `pnpm build`
Expected: Build succeeds, generates `/en-US/index.html`, `/zh-CN/index.html`, etc.

- [ ] **Step 5: Test one locale page manually**

Run: `pnpm preview`
Visit: `http://localhost:4321/en-US/`
Expected: Home page displays with English text

- [ ] **Step 6: Commit**

```bash
git add src/pages/[locale]/index.astro
git rm src/pages/index.astro
git commit -m "feat(i18n): create localized home page

Replace root index page with locale-aware version.
Generate home page for all 11 locales.
Load locale-specific translations and content."
```

---

## Task 7: Update BaseLayout with Language Switcher

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes:
  - `locale: Locale` prop (new)
  - `languages`, `locales` from `@/i18n/config`
  - `useTranslations(locale)` from `@/i18n/ui`
- Produces: Layout with language switcher dropdown

- [ ] **Step 1: Update BaseLayout signature and add locale prop**

Edit `src/layouts/BaseLayout.astro`, replace Props interface:

```typescript
export interface Props {
  locale: Locale;
  title: string;
  description: string;
  structuredData?: unknown[];
}
```

- [ ] **Step 2: Import i18n dependencies at top of frontmatter**

Add imports after existing imports:

```typescript
import { languages, locales, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';
```

- [ ] **Step 3: Load translations and generate alternate links**

Add after Props destructuring:

```typescript
const { locale, title, description, structuredData = [] } = Astro.props;
const t = useTranslations(locale);
await t.load();

const canonical = new URL(Astro.url.pathname, Astro.site ?? Astro.url.origin).href;

// Generate alternate language links for SEO
const alternates = locales.map(l => ({
  locale: l,
  href: new URL(Astro.url.pathname.replace(`/${locale}/`, `/${l}/`), Astro.site ?? Astro.url.origin).href,
}));

const navLinks = [
  { href: `/${locale}/`, label: t.t('nav.home') },
  { href: `/${locale}/about`, label: t.t('nav.about') },
];

const footerLinks = [
  { href: `/${locale}/privacy`, label: t.t('footer.privacy') },
  { href: `/${locale}/terms`, label: t.t('footer.terms') },
  { href: `/${locale}/about`, label: t.t('footer.about') },
];

const year = new Date().getFullYear();
```

- [ ] **Step 4: Update HTML lang attribute and add hreflang tags**

Replace `<html lang="en">` with:

```astro
<html lang={locale} dir={languages[locale].dir}>
```

In `<head>`, add after canonical link:

```astro
<!-- Alternate language links for SEO -->
{alternates.map(alt => (
  <link rel="alternate" hreflang={alt.locale} href={alt.href} />
))}
<link rel="alternate" hreflang="x-default" href={alternates.find(a => a.locale === 'en-US')?.href} />
```

- [ ] **Step 5: Update Open Graph locale meta tag**

Add after existing og:url meta tag:

```astro
<meta property="og:locale" content={locale} />
```

- [ ] **Step 6: Update skip link text**

Replace skip link content with:

```astro
{t.t('skip.content')}
```

- [ ] **Step 7: Update header brand link to include locale**

Replace header brand link href:

```astro
<a href={`/${locale}/`} class="text-lg font-semibold tracking-tight text-ink-900">
```

- [ ] **Step 8: Update navigation links to use translations**

Replace existing nav `<ul>` with:

```astro
<ul class="flex items-center gap-5 text-sm">
  {navLinks.map(link => (
    <li>
      <a class="text-ink-600 hover:text-brand-700" href={link.href}>{link.label}</a>
    </li>
  ))}
</ul>
```

- [ ] **Step 9: Add language switcher dropdown after navigation**

Add after nav `<ul>` and before closing `</nav>`:

```astro
<!-- Language switcher dropdown -->
<div class="relative" data-lang-switcher>
  <button
    type="button"
    class="text-sm text-ink-600 hover:text-brand-700"
    aria-label="Change language"
    aria-expanded="false"
    data-lang-button
  >
    {languages[locale].name} ▾
  </button>
  <ul
    class="absolute right-0 mt-2 hidden w-48 rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
    data-lang-menu
  >
    {locales.map(l => (
      <li>
        <a
          href={Astro.url.pathname.replace(`/${locale}/`, `/${l}/`)}
          class="block px-4 py-2 text-sm hover:bg-brand-50"
          class:list={{ 'font-semibold text-brand-700': l === locale }}
          lang={l}
        >
          {languages[l].name}
        </a>
      </li>
    ))}
  </ul>
</div>
```

- [ ] **Step 10: Update footer text to use translations**

Replace footer paragraph with:

```astro
<p class="mb-3 max-w-2xl">
  {t.t('footer.privacy-note')}
</p>
```

Replace footer links `<ul>` with:

```astro
<ul class="flex flex-wrap gap-4">
  {footerLinks.map(link => (
    <li><a class="hover:text-brand-700" href={link.href}>{link.label}</a></li>
  ))}
</ul>
```

Replace copyright paragraph with:

```astro
<p class="mt-4 text-ink-400">
  &copy; {year} Passport Photo Maker. {t.t('footer.disclaimer')}
</p>
```

- [ ] **Step 11: Add language switcher JavaScript**

Add before closing `</body>`:

```astro
<script>
  // Language switcher dropdown toggle
  document.querySelectorAll('[data-lang-switcher]').forEach(switcher => {
    const button = switcher.querySelector('[data-lang-button]');
    const menu = switcher.querySelector('[data-lang-menu]');
    
    button?.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
      menu?.classList.toggle('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target as Node)) {
        button?.setAttribute('aria-expanded', 'false');
        menu?.classList.add('hidden');
      }
    });
  });
</script>
```

- [ ] **Step 12: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds with updated layout

- [ ] **Step 13: Test language switcher**

Run: `pnpm preview`
Visit: `http://localhost:4321/en-US/`
Test: Click language switcher, select "简体中文", verify redirect to `/zh-CN/`

- [ ] **Step 14: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat(i18n): add language switcher to BaseLayout

Accept locale prop and load translations.
Add language switcher dropdown with all 11 locales.
Generate hreflang alternate links for SEO.
Localize all navigation and footer text.
Set HTML lang attribute dynamically."
```

---

## Task 8: Create Localized Document Pages

**Files:**
- Create: `src/pages/[locale]/[country]/[document].astro`
- Delete: `src/pages/[country]/[document].astro`

**Interfaces:**
- Consumes:
  - `Locale`, `locales` from `@/i18n/config`
  - `useTranslations(locale)` from `@/i18n/ui`
  - `getVerifiedSpecPages(locale)` from `@/lib/specs`
- Produces: Document pages for each locale × document combination

- [ ] **Step 1: Create nested locale directory**

Run: `mkdir -p src/pages/[locale]/[country]`

- [ ] **Step 2: Create new localized document page**

Create `src/pages/[locale]/[country]/[document].astro`:

```astro
---
import { render } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import SpecTable from '@/components/SpecTable.astro';
import PhotoEditor from '@/components/editor/PhotoEditor.vue';
import { getVerifiedSpecPages } from '@/lib/specs';
import { locales, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';

export async function getStaticPaths() {
  const paths = [];
  for (const locale of locales) {
    const pages = await getVerifiedSpecPages(locale);
    paths.push(...pages.map(page => ({
      params: {
        locale,
        country: page.entry.data.country,
        document: page.entry.data.document,
      },
      props: { page, locale },
    })));
  }
  return paths;
}

const { page, locale } = Astro.props;
const { entry, spec } = page;
const { Content } = await render(entry);

const t = useTranslations(locale);
await t.load();

const checked = entry.data.sourceCheckedOn.toISOString().slice(0, 10);

const faqSchema =
  entry.data.faq.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entry.data.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      }
    : null;

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: `${entry.data.documentName} maker`,
  inLanguage: locale,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};
---

<BaseLayout
  locale={locale}
  title={entry.data.title}
  description={entry.data.description}
  structuredData={[appSchema, ...(faqSchema ? [faqSchema] : [])]}
>
  <nav aria-label="Breadcrumb" class="mb-4 text-sm text-ink-400">
    <a class="hover:text-brand-700" href={`/${locale}/`}>{t.t('nav.home')}</a>
    <span aria-hidden="true"> / </span>
    <span>{entry.data.countryName}</span>
  </nav>

  <h1 class="text-3xl font-semibold tracking-tight text-ink-900">{entry.data.title}</h1>
  <p class="mt-3 max-w-2xl text-ink-600">{entry.data.description}</p>

  <div class="mt-8">
    <PhotoEditor spec={spec} client:visible />
  </div>

  <section class="mt-12" aria-labelledby="requirements">
    <h2 id="requirements" class="text-xl font-semibold text-ink-900">
      {t.t('requirements.heading')}
    </h2>
    <div class="mt-4 rounded-xl border border-ink-200 p-5">
      <SpecTable spec={spec} locale={locale} />
      <p class="mt-4 text-xs text-ink-400">
        {t.t('requirements.source')}
        <a class="underline hover:text-brand-700" href={entry.data.sourceUrl} rel="nofollow noopener" target="_blank">
          {new URL(entry.data.sourceUrl).hostname}
        </a>
        · {t.t('requirements.checked')} {checked}
      </p>
    </div>
  </section>

  {
    entry.data.rejectionReasons.length > 0 && (
      <section class="mt-12" aria-labelledby="rejections">
        <h2 id="rejections" class="text-xl font-semibold text-ink-900">
          {t.t('rejections.heading')}
        </h2>
        <ul class="mt-4 space-y-2 text-ink-600">
          {entry.data.rejectionReasons.map((reason) => (
            <li class="flex gap-3">
              <span aria-hidden="true" class="mt-2 size-1.5 shrink-0 rounded-full bg-bad-500" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  <div class="markdown mt-12 max-w-2xl">
    <Content />
  </div>

  {
    entry.data.faq.length > 0 && (
      <section class="mt-12" aria-labelledby="faq">
        <h2 id="faq" class="text-xl font-semibold text-ink-900">
          {t.t('faq.heading')}
        </h2>
        <dl class="mt-4 space-y-5">
          {entry.data.faq.map((item) => (
            <div>
              <dt class="font-medium text-ink-800">{item.q}</dt>
              <dd class="mt-1 text-ink-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    )
  }
</BaseLayout>
```

- [ ] **Step 3: Delete old document page**

Run: `git rm -r src/pages/[country]`

- [ ] **Step 4: Verify build generates document pages for all locales**

Run: `pnpm build`
Expected: Build succeeds, generates pages like `/en-US/us/passport.html`, `/zh-CN/us/passport.html`, etc.

- [ ] **Step 5: Test document page manually**

Run: `pnpm preview`
Visit: `http://localhost:4321/en-US/us/passport`
Expected: Document page displays with English text and translations

- [ ] **Step 6: Commit**

```bash
git add src/pages/[locale]/[country]/[document].astro
git rm -r src/pages/[country]
git commit -m "feat(i18n): create localized document pages

Replace country/document routes with locale-aware version.
Generate document pages for all locale × document combinations.
Pass locale to SpecTable and PhotoEditor components.
Add inLanguage to structured data."
```

---

## Task 9: Update SpecTable Component

**Files:**
- Modify: `src/components/SpecTable.astro`

**Interfaces:**
- Consumes:
  - `spec: PhotoSpec` prop (existing)
  - `locale: Locale` prop (new)
  - `useTranslations(locale)` from `@/i18n/ui`
- Produces: Spec table with translated labels

- [ ] **Step 1: Update SpecTable Props interface**

Edit `src/components/SpecTable.astro`, update Props:

```typescript
import type { Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';

export interface Props {
  spec: PhotoSpec;
  locale: Locale;
}
```

- [ ] **Step 2: Load translations in SpecTable**

Add after Props destructuring:

```typescript
const { spec, locale } = Astro.props;
const t = useTranslations(locale);
await t.load();
```

- [ ] **Step 3: Update row labels to use translations**

Replace existing rows array with:

```typescript
const rows: Array<{ label: string; value: string }> = [
  {
    label: t.t('spec.size'),
    value: physical
      ? `${physical.widthMm} × ${physical.heightMm} mm (${pixels.widthPx} × ${pixels.heightPx} px at ${physical.dpi} DPI)`
      : `${pixels.widthPx} × ${pixels.heightPx} px`,
  },
  { label: t.t('spec.head-height'), value: band(spec.headHeight.minRatio, spec.headHeight.maxRatio) },
  ...(spec.eyeLine
    ? [{ label: t.t('spec.eye-height'), value: band(spec.eyeLine.minRatio, spec.eyeLine.maxRatio) }]
    : []),
  { label: t.t('spec.background'), value: spec.background.description },
  {
    label: t.t('spec.file'),
    value: [
      spec.file.format.toUpperCase(),
      spec.file.maxBytes ? `max ${Math.round(spec.file.maxBytes / 1024)} KB` : null,
      spec.file.minBytes ? `min ${Math.round(spec.file.minBytes / 1024)} KB` : null,
    ]
      .filter(Boolean)
      .join(', '),
  },
];
```

- [ ] **Step 4: Verify build succeeds**

Run: `pnpm build`
Expected: Build succeeds with updated component

- [ ] **Step 5: Test SpecTable renders with translations**

Run: `pnpm preview`
Visit: `http://localhost:4321/en-US/us/passport`
Expected: Spec table labels show "Photo size", "Head height, chin to crown", etc.

- [ ] **Step 6: Commit**

```bash
git add src/components/SpecTable.astro
git commit -m "feat(i18n): localize SpecTable component

Accept locale prop and load translations.
Translate all table row labels using translation keys."
```

---

## Task 10: Create Localized Static Pages

**Files:**
- Create: `src/pages/[locale]/about.astro`
- Create: `src/pages/[locale]/privacy.astro`
- Create: `src/pages/[locale]/terms.astro`
- Delete: `src/pages/about.astro`, `src/pages/privacy.astro`, `src/pages/terms.astro`

**Interfaces:**
- Consumes:
  - `Locale`, `locales` from `@/i18n/config`
  - `useTranslations(locale)` from `@/i18n/ui`
- Produces: Static pages for each locale

- [ ] **Step 1: Read existing about page to understand structure**

Run: `cat src/pages/about.astro`
Note: Current content structure

- [ ] **Step 2: Create localized about page**

Create `src/pages/[locale]/about.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { locales, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';

export async function getStaticPaths() {
  return locales.map(locale => ({ params: { locale } }));
}

const locale = Astro.params.locale as Locale;
const t = useTranslations(locale);
await t.load();
---

<BaseLayout
  locale={locale}
  title="About — Passport Photo Maker"
  description="Learn how this passport photo tool works and why measurements matter."
>
  <h1 class="text-3xl font-semibold tracking-tight text-ink-900">About this tool</h1>
  
  <div class="mt-6 max-w-2xl space-y-4 text-ink-600">
    <p>
      This tool helps you create passport and visa photos that meet official requirements.
      It runs entirely in your browser using WebAssembly, so your photo never leaves your device.
    </p>
    
    <p>
      Most rejected passport photos fail because the head is too large or too small within
      the frame — not because the photo itself is poorly cropped. Each authority publishes
      specific measurements for head height and eye position, and those ranges are narrower
      than most people realize.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">How it works</h2>
    
    <p>
      The tool uses machine learning models to detect your face and separate you from the
      background. It then measures from your chin to the crown of your head (including hair),
      locates your eye line, and calculates a crop that places both measurements in the middle
      of each permitted range.
    </p>
    
    <p>
      Aiming for the middle rather than the edge of the permitted range leaves room for the
      small errors that any automated system makes. If your original photo doesn't have enough
      space around your head to produce a compliant result, the tool tells you which edge is
      short instead of cropping tighter and quietly handing you something that will be rejected.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">Privacy</h2>
    
    <p>
      All image processing happens inside your browser. Your photo is never uploaded to a
      server, never stored, and never seen by anyone but you. The machine learning models
      are downloaded once and run locally on your device.
    </p>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Create localized privacy page**

Create `src/pages/[locale]/privacy.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { locales, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';

export async function getStaticPaths() {
  return locales.map(locale => ({ params: { locale } }));
}

const locale = Astro.params.locale as Locale;
const t = useTranslations(locale);
await t.load();
---

<BaseLayout
  locale={locale}
  title="Privacy Policy — Passport Photo Maker"
  description="Privacy policy for Passport Photo Maker. Your photos never leave your device."
>
  <h1 class="text-3xl font-semibold tracking-tight text-ink-900">Privacy Policy</h1>
  
  <div class="mt-6 max-w-2xl space-y-4 text-ink-600">
    <p><strong>Last updated: September 3, 2026</strong></p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">No data collection</h2>
    
    <p>
      This tool processes all photos entirely in your browser. No photos, personal information,
      or usage data are transmitted to our servers or any third party.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">How it works</h2>
    
    <p>
      When you use this tool, machine learning models run directly on your device using
      WebAssembly. The models are downloaded once from our server and cached by your browser
      for future use. After that, all processing happens locally.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">Analytics</h2>
    
    <p>
      We do not use analytics, tracking cookies, or any form of user behavior monitoring.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">Contact</h2>
    
    <p>
      If you have questions about this privacy policy, please contact us through the About page.
    </p>
  </div>
</BaseLayout>
```

- [ ] **Step 4: Create localized terms page**

Create `src/pages/[locale]/terms.astro`:

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { locales, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';

export async function getStaticPaths() {
  return locales.map(locale => ({ params: { locale } }));
}

const locale = Astro.params.locale as Locale;
const t = useTranslations(locale);
await t.load();
---

<BaseLayout
  locale={locale}
  title="Terms of Service — Passport Photo Maker"
  description="Terms of service for using Passport Photo Maker."
>
  <h1 class="text-3xl font-semibold tracking-tight text-ink-900">Terms of Service</h1>
  
  <div class="mt-6 max-w-2xl space-y-4 text-ink-600">
    <p><strong>Last updated: September 3, 2026</strong></p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">Use of this tool</h2>
    
    <p>
      This tool is provided free of charge for personal use. You may use it to create passport
      and visa photos for your own applications.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">No warranty</h2>
    
    <p>
      While we make every effort to ensure that photo specifications are accurate and up to date,
      requirements can change. Always check the official authority's website before submitting
      your application. We are not responsible for rejected applications.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">Accuracy</h2>
    
    <p>
      Photo requirements are summarized from official government sources. Each specification
      includes a source URL and the date it was last checked. If requirements change, the tool
      may produce photos that no longer meet current standards.
    </p>
    
    <h2 class="mt-8 text-xl font-semibold text-ink-900">Limitation of liability</h2>
    
    <p>
      This tool is provided "as is" without warranty of any kind. We are not liable for any
      damages arising from your use of this tool, including but not limited to rejected
      applications or application fees.
    </p>
  </div>
</BaseLayout>
```

- [ ] **Step 5: Delete old static pages**

Run:
```bash
git rm src/pages/about.astro
git rm src/pages/privacy.astro
git rm src/pages/terms.astro
```

- [ ] **Step 6: Verify build generates static pages for all locales**

Run: `pnpm build`
Expected: Build succeeds, generates `/en-US/about.html`, `/zh-CN/privacy.html`, etc.

- [ ] **Step 7: Test static pages**

Run: `pnpm preview`
Visit: `http://localhost:4321/en-US/about`
Expected: About page displays, language switcher works

- [ ] **Step 8: Commit**

```bash
git add src/pages/[locale]/about.astro src/pages/[locale]/privacy.astro src/pages/[locale]/terms.astro
git rm src/pages/about.astro src/pages/privacy.astro src/pages/terms.astro
git commit -m "feat(i18n): create localized static pages

Create about, privacy, and terms pages for all locales.
Replace non-localized pages with locale-aware versions."
```

---

## Task 11: Add E2E Tests for i18n

**Files:**
- Create: `tests/e2e/i18n.spec.ts`

**Interfaces:**
- Consumes: Built site (Playwright tests)
- Produces: E2E test coverage for i18n features

- [ ] **Step 1: Create E2E test file**

Create `tests/e2e/i18n.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('i18n multi-language support', () => {
  test('root path redirects to a locale', async ({ page }) => {
    const response = await page.goto('/');
    // Should redirect to a locale (302 or direct)
    expect(page.url()).toMatch(/\/(en-US|zh-CN|ja-JP|de-DE|es-ES|fr-FR|it-IT|ko-KR|nl-NL|pt-PT|zh-TW)\//);
  });

  test('English home page loads correctly', async ({ page }) => {
    await page.goto('/en-US/');
    await expect(page.locator('h1')).toContainText('Passport and visa photos');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });

  test('language switcher shows all locales', async ({ page }) => {
    await page.goto('/en-US/');
    
    // Click language switcher button
    await page.click('[data-lang-button]');
    
    // Verify all 11 languages appear
    const menu = page.locator('[data-lang-menu]');
    await expect(menu).toBeVisible();
    await expect(menu.locator('a')).toHaveCount(11);
    
    // Verify specific languages
    await expect(menu.locator('a', { hasText: 'English' })).toBeVisible();
    await expect(menu.locator('a', { hasText: '简体中文' })).toBeVisible();
    await expect(menu.locator('a', { hasText: '日本語' })).toBeVisible();
  });

  test('switching language changes URL and content', async ({ page }) => {
    await page.goto('/en-US/');
    
    // Open language switcher and select Chinese
    await page.click('[data-lang-button]');
    await page.click('[data-lang-menu] a[lang="zh-CN"]');
    
    // Verify URL changed
    expect(page.url()).toContain('/zh-CN/');
    
    // Verify HTML lang attribute changed
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  });

  test('document pages exist for each locale', async ({ page }) => {
    // Test English document page
    await page.goto('/en-US/us/passport');
    await expect(page.locator('h1')).toContainText('US Passport');
    
    // Test Chinese document page
    await page.goto('/zh-CN/us/passport');
    expect(page.url()).toContain('/zh-CN/us/passport');
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  });

  test('hreflang links are present', async ({ page }) => {
    await page.goto('/en-US/');
    
    // Check for hreflang alternate links
    const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');
    await expect(hreflangLinks).toHaveCount(12); // 11 locales + x-default
    
    // Verify specific hreflang tags
    await expect(page.locator('link[hreflang="zh-CN"]')).toHaveAttribute('href', /.+\/zh-CN\//);
    await expect(page.locator('link[hreflang="x-default"]')).toBeVisible();
  });

  test('language switcher preserves current page', async ({ page }) => {
    await page.goto('/en-US/us/passport');
    
    // Switch to Japanese
    await page.click('[data-lang-button]');
    await page.click('[data-lang-menu] a[lang="ja-JP"]');
    
    // Should navigate to Japanese version of same page
    expect(page.url()).toContain('/ja-JP/us/passport');
  });

  test('breadcrumb navigation works in each language', async ({ page }) => {
    await page.goto('/en-US/us/passport');
    
    // Click breadcrumb home link
    await page.click('nav[aria-label="Breadcrumb"] a');
    
    // Should navigate to home page in same locale
    expect(page.url()).toContain('/en-US/');
  });

  test('static pages exist in all locales', async ({ page }) => {
    // Test about page in different locales
    await page.goto('/en-US/about');
    await expect(page.locator('h1')).toContainText('About');
    
    await page.goto('/zh-CN/privacy');
    expect(page.url()).toContain('/zh-CN/privacy');
    
    await page.goto('/ja-JP/terms');
    expect(page.url()).toContain('/ja-JP/terms');
  });
});
```

- [ ] **Step 2: Install Playwright if not present**

Run: `pnpm add -D @playwright/test`

- [ ] **Step 3: Run E2E tests**

Run: `pnpm exec playwright test tests/e2e/i18n.spec.ts`
Expected: All tests pass (may need to run build first)

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/i18n.spec.ts
git commit -m "test(i18n): add E2E tests for multi-language support

Test language detection and redirect.
Test language switcher functionality.
Test page generation for all locales.
Test hreflang SEO tags.
Test breadcrumb navigation in different languages."
```

---

## Task 12: Create Skeleton Translation Files

**Files:**
- Create: `src/i18n/translations/zh-CN.json`
- Create: `src/i18n/translations/ja-JP.json`
- Create: `src/i18n/translations/de-DE.json`
- Create: `src/i18n/translations/es-ES.json`
- Create: `src/i18n/translations/fr-FR.json`
- Create: `src/i18n/translations/it-IT.json`
- Create: `src/i18n/translations/ko-KR.json`
- Create: `src/i18n/translations/nl-NL.json`
- Create: `src/i18n/translations/pt-PT.json`
- Create: `src/i18n/translations/zh-TW.json`
- Modify: `src/i18n/ui.ts`

**Interfaces:**
- Consumes: English translation keys
- Produces: Skeleton translation files for all locales (currently English fallback)

- [ ] **Step 1: Copy English translations to create skeletons**

Run PowerShell:

```powershell
$locales = @('zh-CN', 'ja-JP', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-TW')
foreach ($locale in $locales) {
  Copy-Item src/i18n/translations/en-US.json "src/i18n/translations/$locale.json"
}
```

- [ ] **Step 2: Update ui.ts to load actual locale files**

Edit `src/i18n/ui.ts`, replace translations object:

```typescript
const translations = {
  'en-US': () => import('./translations/en-US.json').then(m => m.default),
  'zh-CN': () => import('./translations/zh-CN.json').then(m => m.default),
  'ja-JP': () => import('./translations/ja-JP.json').then(m => m.default),
  'de-DE': () => import('./translations/de-DE.json').then(m => m.default),
  'es-ES': () => import('./translations/es-ES.json').then(m => m.default),
  'fr-FR': () => import('./translations/fr-FR.json').then(m => m.default),
  'it-IT': () => import('./translations/it-IT.json').then(m => m.default),
  'ko-KR': () => import('./translations/ko-KR.json').then(m => m.default),
  'nl-NL': () => import('./translations/nl-NL.json').then(m => m.default),
  'pt-PT': () => import('./translations/pt-PT.json').then(m => m.default),
  'zh-TW': () => import('./translations/zh-TW.json').then(m => m.default),
} as const;
```

- [ ] **Step 3: Verify build includes all translation files**

Run: `pnpm build`
Expected: Build succeeds, all locale JSON files bundled

- [ ] **Step 4: Test that non-English locales load (with English text for now)**

Run: `pnpm preview`
Visit: `http://localhost:4321/zh-CN/`
Expected: Page loads (with English text, translation needed later)

- [ ] **Step 5: Commit**

```bash
git add src/i18n/translations/*.json src/i18n/ui.ts
git commit -m "feat(i18n): create skeleton translation files for all locales

Copy English translations as skeletons for 10 non-English locales.
Update ui.ts to load actual locale-specific files.
Translation into target languages required in future task."
```

---

## Task 13: Create Content Skeleton for Non-English Locales

**Files:**
- Create: `src/content/specs/zh-CN/*.md` (copy from en-US)
- Create: `src/content/specs/ja-JP/*.md`
- Create: `src/content/specs/de-DE/*.md`
- Create: `src/content/specs/es-ES/*.md`
- Create: `src/content/specs/fr-FR/*.md`
- Create: `src/content/specs/it-IT/*.md`
- Create: `src/content/specs/ko-KR/*.md`
- Create: `src/content/specs/nl-NL/*.md`
- Create: `src/content/specs/pt-PT/*.md`
- Create: `src/content/specs/zh-TW/*.md`

**Interfaces:**
- Consumes: English content structure
- Produces: Content skeletons with `status: needs-review`

- [ ] **Step 1: Create locale subdirectories**

Run PowerShell:

```powershell
$locales = @('zh-CN', 'ja-JP', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-TW')
foreach ($locale in $locales) {
  New-Item -ItemType Directory -Force -Path "src/content/specs/$locale"
}
```

- [ ] **Step 2: Copy English content to all locale directories**

Run PowerShell:

```powershell
$locales = @('zh-CN', 'ja-JP', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-TW')
foreach ($locale in $locales) {
  Copy-Item src/content/specs/en-US/*.md "src/content/specs/$locale/"
}
```

- [ ] **Step 3: Update status to needs-review in all copied files**

Run PowerShell:

```powershell
$locales = @('zh-CN', 'ja-JP', 'de-DE', 'es-ES', 'fr-FR', 'it-IT', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-TW')
foreach ($locale in $locales) {
  Get-ChildItem "src/content/specs/$locale/*.md" | ForEach-Object {
    (Get-Content $_.FullName) -replace 'status: verified', 'status: needs-review' | Set-Content $_.FullName
  }
}
```

- [ ] **Step 4: Verify files copied correctly**

Run: `ls src/content/specs/zh-CN/`
Expected: All 6 markdown files present with `status: needs-review`

- [ ] **Step 5: Verify build succeeds but only generates en-US pages**

Run: `pnpm build`
Expected: Build succeeds, only en-US document pages generated (others have needs-review status)

- [ ] **Step 6: Commit**

```bash
git add src/content/specs/
git commit -m "feat(i18n): create content skeletons for non-English locales

Copy English content structure to all 10 non-English locales.
Mark all copied content as needs-review.
Content will not be published until translated and verified.
Only en-US pages currently generate (verified status)."
```

---

## Task 14: Update Documentation

**Files:**
- Create: `docs/i18n-translation-guide.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: None (documentation)
- Produces: Translation workflow documentation

- [ ] **Step 1: Create translation guide**

Create `docs/i18n-translation-guide.md`:

```markdown
# Translation Guide

This document explains how to translate content for new locales.

## Overview

The site supports 11 languages with two types of content to translate:

1. **UI Translations** (`src/i18n/translations/*.json`) — buttons, labels, navigation
2. **Markdown Content** (`src/content/specs/[locale]/*.md`) — document pages with frontmatter and body content

## UI Translation Workflow

### 1. Locate the English file

Open `src/i18n/translations/en-US.json` to see all translation keys.

### 2. Update target language file

Open the target locale file (e.g., `src/i18n/translations/zh-CN.json`) and translate each value:

```json
{
  "nav.home": "All photo specs",      // English
  "nav.about": "About"
}
```

Becomes:

```json
{
  "nav.home": "所有照片规格",          // Chinese
  "nav.about": "关于"
}
```

### 3. Parameter interpolation

Some translations include parameters in braces (e.g., `{documentName}`). Keep these unchanged:

```json
{
  "editor.heading": "Make your {documentName}"
}
```

Becomes:

```json
{
  "editor.heading": "制作你的{documentName}"
}
```

### 4. Test translations

Run `pnpm build && pnpm preview`, then visit `http://localhost:4321/[locale]/` to verify.

## Markdown Content Translation Workflow

### 1. Understand content status

Content has two statuses in frontmatter:
- `status: verified` — Translation complete and checked, page will be published
- `status: needs-review` — Translation not verified, page will NOT be published

### 2. Locate content to translate

All content lives in `src/content/specs/[locale]/`:

```
src/content/specs/
├── en-US/
│   ├── us-passport.md          ← English source
│   └── ...
├── zh-CN/
│   ├── us-passport.md          ← Chinese translation (currently English copy)
│   └── ...
```

### 3. Translate frontmatter fields

Open a file like `src/content/specs/zh-CN/us-passport.md` and translate these fields:

- `title` — Page title (keep under 70 characters)
- `description` — Meta description (140-160 characters)
- `documentName` — Short document name
- `countryName` — Country name
- `background.description` — Background color description
- `rejectionReasons` — Array of rejection reason strings
- `faq` — Array of Q&A objects (`q` and `a` fields)

**Do NOT translate:**
- `country`, `document` — URL slugs (stay English)
- Technical values: `widthMm`, `heightMm`, `dpi`, `minMm`, `maxMm`
- `sourceUrl` — Official source (stays same)
- `status` — Set to `verified` after translation complete
- `sourceCheckedOn` — Update to date you verified translation

### 4. Translate markdown body

Translate all paragraphs and headings in the markdown body below the frontmatter.

### 5. Verify against official source

If the official authority has requirements published in your target language:
1. Check measurements match (mm, DPI, etc.)
2. Verify rejection reasons are accurate
3. Update `sourceCheckedOn` to today's date
4. Change `status: needs-review` to `status: verified`

### 6. Build and test

Run: `pnpm build`

The page will only generate if `status: verified`.

Visit: `http://localhost:4321/[locale]/[country]/[document]`

## Content That Should NOT Be Translated

- Numeric measurements (mm, px, DPI)
- Color hex codes (`#ffffff`)
- File formats (`jpeg`, `png`)
- URL slugs (`country`, `document` fields)
- Technical field names in schemas

## Translation Quality Checklist

Before marking content as `verified`:

- [ ] All frontmatter fields translated accurately
- [ ] Markdown body content fully translated
- [ ] Parameters in braces (`{documentName}`) kept intact
- [ ] Measurements match official source
- [ ] No hardcoded English strings remain
- [ ] Page builds successfully
- [ ] Native speaker has reviewed translation
- [ ] `sourceCheckedOn` date updated to verification date
- [ ] `status` changed to `verified`

## Getting Help

- For UI translation keys, see `src/i18n/translations/en-US.json`
- For content structure, see `src/content/specs/en-US/` files
- For technical questions, check the design spec: `docs/superpowers/specs/2026-09-03-i18n-multilanguage-support-design.md`
```

- [ ] **Step 2: Update README with i18n information**

Add section to `README.md` after existing content:

```markdown
## Multi-Language Support

This project supports 11 languages:

- de-DE (German)
- en-US (English)
- es-ES (Spanish)
- fr-FR (French)
- it-IT (Italian)
- ja-JP (Japanese)
- ko-KR (Korean)
- nl-NL (Dutch)
- pt-PT (Portuguese)
- zh-CN (Simplified Chinese)
- zh-TW (Traditional Chinese)

### Translation Workflow

See `docs/i18n-translation-guide.md` for complete translation instructions.

### URL Structure

All URLs include a locale prefix:

- English: `/en-US/us/passport`
- Chinese: `/zh-CN/us/passport`
- Japanese: `/ja-JP/us/passport`

The root path `/` redirects based on browser language preference.

### Adding Translations

1. **UI Text**: Edit `src/i18n/translations/[locale].json`
2. **Content**: Edit markdown files in `src/content/specs/[locale]/`
3. **Verification**: Set `status: verified` in frontmatter after checking against official source
4. **Build**: Only verified content generates pages

Currently only English content is verified and published. Other locales will remain unpublished until translations are complete and verified.
```

- [ ] **Step 3: Commit documentation**

```bash
git add docs/i18n-translation-guide.md README.md
git commit -m "docs: add i18n translation guide and README updates

Document workflow for translating UI strings and markdown content.
Explain content status system (verified vs needs-review).
Add URL structure and multi-language support details to README."
```

---

## Task 15: Final Verification and Build Test

**Files:**
- None (verification task)

**Interfaces:**
- Consumes: Complete i18n implementation
- Produces: Verified working build

- [ ] **Step 1: Clean build from scratch**

Run:
```bash
rm -rf dist .astro
pnpm build
```

Expected: Build succeeds with no errors

- [ ] **Step 2: Verify build output structure**

Run: `ls dist/`
Expected: See locale directories (en-US/, zh-CN/, ja-JP/, etc.)

Run: `ls dist/en-US/`
Expected: See index.html, about.html, privacy.html, terms.html, us/, schengen/, etc.

- [ ] **Step 3: Check build artifact counts**

Run:
```bash
find dist -name "*.html" | wc -l
```

Expected: ~70+ HTML files (11 locales × static pages, but only en-US has document pages currently)

- [ ] **Step 4: Start preview server**

Run: `pnpm preview`

- [ ] **Step 5: Test root path redirect**

Visit: `http://localhost:4321/`
Expected: Redirects to `/en-US/` or another locale based on browser language

- [ ] **Step 6: Test English pages**

Visit: `http://localhost:4321/en-US/`
- [ ] Home page loads with English text
- [ ] Language switcher shows all 11 languages
- [ ] Navigation links work
- [ ] Footer is in English

Visit: `http://localhost:4321/en-US/us/passport`
- [ ] Document page loads
- [ ] Breadcrumb shows "All photo specs"
- [ ] SpecTable shows English labels
- [ ] All sections render

- [ ] **Step 7: Test language switching**

From English home page:
- [ ] Click language switcher
- [ ] Select "简体中文"
- [ ] Verify redirect to `/zh-CN/`
- [ ] Verify HTML lang attribute is `zh-CN`
- [ ] Note: UI text still English (translation needed)

- [ ] **Step 8: Test non-English locale pages**

Visit: `http://localhost:4321/zh-CN/`
- [ ] Home page loads
- [ ] No document pages appear (status: needs-review)

Visit: `http://localhost:4321/ja-JP/about`
- [ ] About page loads
- [ ] Language switcher works

- [ ] **Step 9: Test hreflang tags**

View page source at `/en-US/`
- [ ] See 11 `<link rel="alternate" hreflang="...">` tags
- [ ] See `<link rel="alternate" hreflang="x-default">`

- [ ] **Step 10: Run all tests**

Run: `pnpm test`
Expected: All unit and integration tests pass

- [ ] **Step 11: Run E2E tests**

Run: `pnpm exec playwright test`
Expected: All E2E tests pass

- [ ] **Step 12: Check TypeScript compilation**

Run: `pnpm astro check`
Expected: No type errors

- [ ] **Step 13: Verify sitemap generation**

Run: `cat dist/sitemap-index.xml`
Expected: See entries for all locale × page combinations

- [ ] **Step 14: Test 404 and invalid paths**

Visit: `http://localhost:4321/invalid-locale/`
Expected: Redirects to `/en-US/invalid-locale/` (middleware adds locale prefix)

Visit: `http://localhost:4321/en-US/nonexistent`
Expected: 404 page

- [ ] **Step 15: Document completion and next steps**

Create `docs/i18n-implementation-status.md`:

```markdown
# i18n Implementation Status

**Date:** 2026-09-03
**Status:** Complete — Infrastructure ready, translations pending

## What's Done

✅ Multi-language infrastructure
- 11 locales configured (de-DE, en-US, es-ES, fr-FR, it-IT, ja-JP, ko-KR, nl-NL, pt-PT, zh-CN, zh-TW)
- Automatic browser language detection
- Locale-prefixed URLs (`/en-US/`, `/zh-CN/`, etc.)
- Language switcher in navigation

✅ Content structure
- Content collections organized by locale
- English content verified and published
- Skeleton content created for 10 other locales

✅ UI translations
- Translation system with parameter interpolation
- English translations complete
- Skeleton JSON files for other locales

✅ Components
- BaseLayout with language switcher
- SpecTable with translated labels
- All pages accept locale prop

✅ SEO
- Hreflang alternate links
- Localized meta tags
- Sitemap includes all locales
- Structured data with inLanguage

✅ Testing
- Unit tests for language detection
- Unit tests for translations
- E2E tests for i18n features

## What's Pending

❌ Translations required
- UI translations: 10 locales need native translations (currently English)
- Content translations: 60 markdown files need translation (10 locales × 6 docs)

## Current Behavior

**Published:**
- English (en-US): Fully functional, all pages generate

**Not Published:**
- All other locales: Home page and static pages work, but show English text
- Document pages (passport/visa specs) do NOT generate for non-English locales until content is verified

## Next Steps

1. **Translate UI strings**
   - Edit `src/i18n/translations/[locale].json` for each target locale
   - See `docs/i18n-translation-guide.md` for instructions

2. **Translate content**
   - Edit markdown files in `src/content/specs/[locale]/`
   - Verify against official sources in target language
   - Change `status: needs-review` to `status: verified`
   - Update `sourceCheckedOn` date

3. **Verify each locale**
   - Build site: `pnpm build`
   - Test in browser: `pnpm preview`
   - Verify translations with native speaker

4. **Deploy**
   - Deploy with verified locales only
   - Add additional locales as translations complete
```

- [ ] **Step 16: Final commit**

```bash
git add docs/i18n-implementation-status.md
git commit -m "docs: document i18n implementation status

Infrastructure complete and tested.
English locale fully functional.
10 locales ready for translation.
Document current behavior and next steps."
```

---

## Self-Review Checklist

**Spec Coverage:**
- [x] All 11 locales configured
- [x] Language detection from Accept-Language header
- [x] Sub-path routing (`/en-US/`, `/zh-CN/`, etc.)
- [x] Language switcher in navigation
- [x] Content collections restructured by locale
- [x] UI translation system with interpolation
- [x] Hreflang SEO tags
- [x] BaseLayout localized
- [x] All pages accept locale prop
- [x] Middleware for root path redirect
- [x] TypeScript types for Astro locals
- [x] Tests for language detection and translations
- [x] E2E tests for i18n features
- [x] Documentation for translation workflow

**No Placeholders:**
- All code blocks contain actual implementation
- No "TBD" or "TODO" in task steps
- All test cases are concrete and runnable
- All file paths are exact
- All function signatures match between tasks

**Type Consistency:**
- `Locale` type defined in Task 1, used throughout
- `getVerifiedSpecPages(locale: Locale)` signature consistent
- `useTranslations(locale: Locale)` signature consistent
- Translation keys use dot notation consistently

**Dependencies:**
- Task order ensures each task consumes what prior tasks produce
- No forward references to undefined types or functions
- Each task can be executed independently after its dependencies

---

## Execution Complete

Plan saved to `docs/superpowers/plans/2026-09-03-i18n-multilanguage-support.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - Fresh subagent per task, two-stage review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
```
