# Multi-Language Support (i18n) Design

**Date:** 2026-09-03  
**Status:** Awaiting approval  
**Approach:** Astro native i18n with Content Collections

## Overview

Add support for 11 languages (de-DE, en-US, es-ES, fr-FR, it-IT, ja-JP, ko-KR, nl-NL, pt-PT, zh-CN, zh-TW) to the passport photo tool. All content (markdown files, frontmatter, UI text) will be fully translated for each language.

## Requirements

### Functional Requirements

1. **URL Structure**: Sub-path routing (`/en-US/`, `/zh-CN/`, etc.)
2. **Language Detection**: Automatic browser language detection with redirect from `/`
3. **Content Translation**: Complete translation of all markdown content and frontmatter
4. **UI Translation**: All interface text translated (buttons, labels, navigation, error messages)
5. **Language Switcher**: Dropdown in navigation showing localized language names
6. **SEO**: Proper hreflang tags, localized meta tags, canonical URLs per language

### Supported Languages

| Locale | Language | Native Name |
|--------|----------|-------------|
| de-DE | German | Deutsch |
| en-US | English (US) | English |
| es-ES | Spanish | Español |
| fr-FR | French | Français |
| it-IT | Italian | Italiano |
| ja-JP | Japanese | 日本語 |
| ko-KR | Korean | 한국어 |
| nl-NL | Dutch | Nederlands |
| pt-PT | Portuguese | Português |
| zh-CN | Chinese (Simplified) | 简体中文 |
| zh-TW | Chinese (Traditional) | 繁體中文 |

Default locale: `en-US`

## Architecture

### Approach: Astro Native i18n

**Why this approach:**
- Zero additional dependencies
- Perfect fit with existing Astro + Content Collections setup
- Static generation of all language versions (optimal performance)
- Type-safe with existing Zod schemas
- Official Astro support with clear upgrade path

**Alternatives considered:**
- astro-i18next: Too heavy for current needs, adds complexity
- Custom lightweight solution: Unnecessary when Astro provides built-in support

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Request                           │
│                         │                                    │
│                         ▼                                    │
│              ┌──────────────────────┐                        │
│              │   Middleware Layer   │                        │
│              │  (Language Detection)│                        │
│              └──────────────────────┘                        │
│                         │                                    │
│          ┌──────────────┴──────────────┐                    │
│          ▼                              ▼                    │
│  ┌───────────────┐             ┌───────────────┐            │
│  │  Root Path /  │             │ Locale Paths  │            │
│  │   (Redirect)  │             │  /en-US/...   │            │
│  └───────────────┘             │  /zh-CN/...   │            │
│                                └───────────────┘            │
│                                         │                    │
│                                         ▼                    │
│                         ┌──────────────────────────┐        │
│                         │   Astro Pages + Layouts  │        │
│                         │  (Load locale context)   │        │
│                         └──────────────────────────┘        │
│                                         │                    │
│                    ┌────────────────────┴───────────┐       │
│                    ▼                                ▼       │
│          ┌──────────────────┐            ┌────────────────┐│
│          │ Content           │            │ UI Translations││
│          │ Collections       │            │  (JSON files)  ││
│          │ (Markdown files)  │            └────────────────┘│
│          └──────────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Configuration

#### Language Configuration (`src/i18n/config.ts`)

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

#### Astro Configuration (`astro.config.mjs`)

```typescript
export default defineConfig({
  site: SITE,
  i18n: {
    defaultLocale: 'en-US',
    locales: ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 
              'ja-JP', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-CN', 'zh-TW'],
    routing: {
      prefixDefaultLocale: true,  // Force /en-US/ not just /
      redirectToDefaultLocale: false,  // Middleware handles root redirect
    },
  },
  // ... rest of existing config
});
```

### 2. Middleware Layer

#### Language Detection (`src/middleware.ts`)

**Purpose**: Detect browser language preference and redirect from root path

**Algorithm**:
1. Parse `Accept-Language` header
2. Match exact locale (e.g., `zh-CN`)
3. Fall back to language-only match (e.g., `zh` → `zh-CN`)
4. Default to `en-US` if no match

**Implementation**:
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

  // No locale prefix: redirect to default
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

  // Try exact match first
  for (const { code } of languages) {
    if (locales.includes(code as any)) return code;
  }

  // Try language-only match
  for (const { code } of languages) {
    const lang = code.split('-')[0];
    const match = locales.find(l => l.startsWith(lang + '-'));
    if (match) return match;
  }

  return defaultLocale;
}
```

### 3. Content Collections Restructure

#### Current Structure
```
src/content/specs/
├── us-passport.md
├── schengen-visa.md
├── uk-passport.md
├── cn-visa.md
├── ca-passport.md
└── us-dv-lottery.md
```

#### New Structure
```
src/content/specs/
├── en-US/
│   ├── us-passport.md
│   ├── schengen-visa.md
│   ├── uk-passport.md
│   ├── cn-visa.md
│   ├── ca-passport.md
│   └── us-dv-lottery.md
├── zh-CN/
│   ├── us-passport.md
│   ├── schengen-visa.md
│   └── ... (same files, translated content)
├── ja-JP/
│   └── ... (same files, translated content)
└── ... (other 8 locales)
```

**Migration Strategy**:
1. Create locale subdirectories
2. Move existing files to `en-US/`
3. Copy structure to other locale directories
4. Mark copied files with `status: needs-review` until translated

#### Updated Content Config (`src/content.config.ts`)

No schema changes required. The collection loader will automatically pick up the nested structure.

#### Updated Spec Helper (`src/lib/specs.ts`)

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
```

### 4. UI Translations System

#### Translation Files Structure

```
src/i18n/
├── config.ts          # Language configuration
├── ui.ts              # Translation helper functions
└── translations/
    ├── en-US.json
    ├── zh-CN.json
    ├── ja-JP.json
    ├── de-DE.json
    ├── es-ES.json
    ├── fr-FR.json
    ├── it-IT.json
    ├── ko-KR.json
    ├── nl-NL.json
    ├── pt-PT.json
    └── zh-TW.json
```

#### Translation Keys (Subset Example)

```json
{
  "nav.home": "All photo specs",
  "nav.about": "About",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.about": "About",
  "footer.disclaimer": "Requirements are summarised from official sources...",
  "footer.privacy-note": "Photos are processed entirely in your browser...",
  "skip.content": "Skip to content",
  
  "home.title": "Passport and visa photos that actually meet the requirements",
  "home.subtitle": "Most rejected photos fail on head size...",
  "home.privacy": "Every step runs inside your browser...",
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
  "faq.heading": "Common questions"
}
```

#### Translation Helper (`src/i18n/ui.ts`)

```typescript
import type { Locale } from './config';

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

export async function getTranslations(locale: Locale) {
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

### 5. Routing Updates

#### Home Page (`src/pages/[locale]/index.astro`)

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
    {pages.map(({ entry, spec, href }) => (
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
    ))}
  </ul>

  <section class="mt-16 max-w-2xl" aria-labelledby="how">
    <h2 id="how" class="text-xl font-semibold text-ink-900">{t.t('home.how-heading')}</h2>
    <!-- Content will be translated in markdown or UI translations -->
  </section>
</BaseLayout>
```

#### Document Page (`src/pages/[locale]/[country]/[document].astro`)

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

const faqSchema = entry.data.faq.length > 0 ? {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entry.data.faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
} : null;

const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: `${entry.data.documentName} maker`,
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
    <PhotoEditor spec={spec} locale={locale} client:visible />
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

  {entry.data.rejectionReasons.length > 0 && (
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
  )}

  <div class="markdown mt-12 max-w-2xl">
    <Content />
  </div>

  {entry.data.faq.length > 0 && (
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
  )}
</BaseLayout>
```

#### Static Pages

Create locale-aware versions:
- `src/pages/[locale]/about.astro`
- `src/pages/[locale]/privacy.astro`
- `src/pages/[locale]/terms.astro`

Each follows the same pattern as index.astro with `getStaticPaths`.

### 6. Layout Updates

#### BaseLayout with Language Switcher (`src/layouts/BaseLayout.astro`)

**Key Changes**:
1. Accept `locale` prop
2. Set `lang` and `dir` attributes on `<html>`
3. Add hreflang alternate links for SEO
4. Load translations with `useTranslations()`
5. Add language switcher dropdown in header
6. Localize all hardcoded strings

```astro
---
import '../styles/global.css';
import { languages, locales, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';

export interface Props {
  locale: Locale;
  title: string;
  description: string;
  structuredData?: unknown[];
}

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
---

<!doctype html>
<html lang={locale} dir={languages[locale].dir}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />

    <!-- Alternate language links for SEO -->
    {alternates.map(alt => (
      <link rel="alternate" hreflang={alt.locale} href={alt.href} />
    ))}
    <link rel="alternate" hreflang="x-default" href={alternates.find(a => a.locale === 'en-US')?.href} />

    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:locale" content={locale} />
    <meta name="twitter:card" content="summary" />

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    {structuredData.map(block => (
      <script is:inline type="application/ld+json" set:html={JSON.stringify(block)} />
    ))}
  </head>
  <body class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow"
    >
      {t.t('skip.content')}
    </a>

    <header class="border-b border-ink-200">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-4">
        <a href={`/${locale}/`} class="text-lg font-semibold tracking-tight text-ink-900">
          Passport Photo Maker
        </a>
        <nav aria-label="Main" class="flex items-center gap-5">
          <ul class="flex items-center gap-5 text-sm">
            {navLinks.map(link => (
              <li>
                <a class="text-ink-600 hover:text-brand-700" href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
          
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
        </nav>
      </div>
    </header>

    <main id="main" class="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <slot />
    </main>

    <footer class="border-t border-ink-200 bg-ink-50">
      <div class="mx-auto max-w-5xl px-4 py-8 text-sm text-ink-600">
        <p class="mb-3 max-w-2xl">
          {t.t('footer.privacy-note')}
        </p>
        <ul class="flex flex-wrap gap-4">
          {footerLinks.map(link => (
            <li><a class="hover:text-brand-700" href={link.href}>{link.label}</a></li>
          ))}
        </ul>
        <p class="mt-4 text-ink-400">
          &copy; {year} Passport Photo Maker. {t.t('footer.disclaimer')}
        </p>
      </div>
    </footer>

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
  </body>
</html>
```

### 7. Component Updates

#### SpecTable Component

Update to accept locale and use translations for table labels:

```astro
---
import { resolvePhysicalSize, resolvePixelSize } from '@/lib/photo/units';
import type { PhotoSpec } from '@/lib/photo/types';
import type { Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/ui';

export interface Props {
  spec: PhotoSpec;
  locale: Locale;
}

const { spec, locale } = Astro.props;
const t = useTranslations(locale);
await t.load();

const pixels = resolvePixelSize(spec.output);
const physical = resolvePhysicalSize(spec.output);

// ... existing label helper functions ...

const rows: Array<{ label: string; value: string }> = [
  { label: t.t('spec.size'), value: /* ... */ },
  { label: t.t('spec.head-height'), value: /* ... */ },
  // ... etc
];
---

<!-- Existing table markup -->
```

#### PhotoEditor Vue Component

Pass locale as prop and use it for client-side translations:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { usePhotoEditor } from './use-photo-editor';
import type { PhotoSpec } from '@/lib/photo/types';
import type { Locale } from '@/i18n/config';

const props = defineProps<{
  spec: PhotoSpec;
  locale: Locale;
  mattingModelId?: string;
}>();

// Load translations client-side
const translations = ref<Record<string, string>>({});
fetch(`/i18n/${props.locale}.json`)
  .then(r => r.json())
  .then(t => { translations.value = t; });

const t = (key: string, params?: Record<string, string>) => {
  let text = translations.value[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
};

// ... rest of component logic
</script>

<template>
  <section>
    <h2>{{ t('editor.heading', { documentName: spec.documentName }) }}</h2>
    <p>{{ t('editor.privacy') }}</p>
    <!-- ... rest of template using t() function -->
  </template>
```

Alternatively, for simpler approach, keep UI text in Astro and pass translated strings as props.

## URL Structure

### URL Examples

| Language | Home | Document Page | Static Page |
|----------|------|---------------|-------------|
| English | `/en-US/` | `/en-US/us/passport` | `/en-US/privacy` |
| Simplified Chinese | `/zh-CN/` | `/zh-CN/us/passport` | `/zh-CN/privacy` |
| Japanese | `/ja-JP/` | `/ja-JP/schengen/visa` | `/ja-JP/about` |
| German | `/de-DE/` | `/de-DE/uk/passport` | `/de-DE/terms` |

### Redirect Behavior

- `/` → Detect browser language → `/en-US/` or `/zh-CN/` etc. (302 temporary)
- `/us/passport` → `/en-US/us/passport` (301 permanent)
- `/about` → `/en-US/about` (301 permanent)

## SEO Considerations

### Hreflang Tags

Every page includes alternate language links:

```html
<link rel="alternate" hreflang="en-US" href="https://example.com/en-US/us/passport" />
<link rel="alternate" hreflang="zh-CN" href="https://example.com/zh-CN/us/passport" />
<link rel="alternate" hreflang="ja-JP" href="https://example.com/ja-JP/us/passport" />
<!-- ... all 11 locales -->
<link rel="alternate" hreflang="x-default" href="https://example.com/en-US/us/passport" />
```

### Sitemap

Update `@astrojs/sitemap` configuration to generate separate entries for each language:

```xml
<urlset>
  <url>
    <loc>https://example.com/en-US/</loc>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="https://example.com/zh-CN/" />
    <!-- ... -->
  </url>
  <url>
    <loc>https://example.com/zh-CN/</loc>
    <xhtml:link rel="alternate" hreflang="en-US" href="https://example.com/en-US/" />
    <!-- ... -->
  </url>
  <!-- ... -->
</urlset>
```

### Structured Data

Update structured data to include `inLanguage` property:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "US passport photo maker",
  "inLanguage": "en-US",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
```

## Migration Strategy

### Phase 1: Infrastructure Setup

1. Create i18n configuration files (`config.ts`, `ui.ts`)
2. Update `astro.config.mjs` with i18n settings
3. Create middleware for language detection
4. Add TypeScript types for Astro locals

### Phase 2: Content Restructure

1. Create locale subdirectories in `src/content/specs/`
2. Move existing English files to `en-US/` subdirectory
3. Copy structure to other locale directories with `status: needs-review`
4. Update `src/lib/specs.ts` to handle locale filtering

### Phase 3: UI Translations

1. Extract all hardcoded strings from components
2. Create English translation file (`en-US.json`)
3. Create skeleton files for other locales
4. Update components to use `useTranslations()` helper

### Phase 4: Routing Updates

1. Refactor page routes to use `[locale]` dynamic segment
2. Update all internal links to include locale prefix
3. Update `getStaticPaths()` to generate pages for all locales
4. Update BaseLayout with language switcher

### Phase 5: Component Updates

1. Update SpecTable to accept locale prop
2. Update PhotoEditor to handle translations
3. Add locale props throughout component tree

### Phase 6: Testing and Deployment

1. Test language detection with different browser settings
2. Verify all 11 languages generate correctly
3. Test language switcher functionality
4. Verify SEO tags (hreflang, Open Graph, etc.)
5. Test with verified content for one locale (en-US)
6. Deploy with single language first, add others incrementally

## Translation Workflow

### Initial Translation

1. English content exists in `en-US/` subdirectory
2. Create corresponding files in other locale directories
3. Mark new files with `status: needs-review` in frontmatter
4. Translator updates content and frontmatter fields
5. Translator changes `status: verified` after checking against source
6. File `sourceCheckedOn` date should match verification date

### Ongoing Maintenance

1. When English content is updated, check `sourceCheckedOn` date
2. If date changes, corresponding translations should be marked `needs-review`
3. Translator reviews official source in their language (if available)
4. Translator updates content and resets `status: verified`
5. Update `sourceCheckedOn` to new verification date

### Content That May Not Need Translation

- Technical measurements (mm, px, DPI) remain numeric
- Color hex codes remain the same
- File formats (JPEG, PNG) remain the same
- Source URLs typically remain the same (official government pages)

### Content That Must Be Translated

- `title`, `description` (meta tags)
- `documentName`, `countryName`
- `background.description`
- `rejectionReasons` array
- `faq` questions and answers
- All markdown body content

## Testing Strategy

### Unit Tests

- Test `detectLocale()` function with various Accept-Language headers
- Test translation key lookup with missing keys
- Test translation interpolation (`{documentName}`)

### Integration Tests

- Test middleware redirects from root path
- Test middleware handles invalid locale paths
- Test `getVerifiedSpecPages()` filters by locale correctly

### E2E Tests (Playwright)

- Test language detection and redirect from `/`
- Test language switcher changes URL and content
- Test all 11 language homepages generate
- Test document pages exist for each locale
- Test hreflang links are present and correct
- Test breadcrumb navigation works in each language

### Manual Testing Checklist

- [ ] Root path `/` redirects based on browser language
- [ ] All 11 language homepages display correctly
- [ ] Language switcher shows all languages
- [ ] Switching languages preserves current page context
- [ ] Breadcrumbs work in each language
- [ ] Static pages (about, privacy, terms) exist in all languages
- [ ] Markdown content renders correctly in all languages
- [ ] PhotoEditor UI text is translated
- [ ] Error messages are translated
- [ ] SEO tags are correct (hreflang, og:locale, etc.)
- [ ] Sitemap includes all language versions

## Performance Considerations

### Build Time

- 11 languages × ~10 pages each = ~110 static pages
- Current build time: ~X seconds
- Expected build time with i18n: ~Y seconds (estimate 2-3x)
- Mitigation: Parallel builds, incremental deployment

### Bundle Size

- Each language's UI translation file: ~5-10 KB
- Total translation files: ~55-110 KB
- Mitigation: Lazy load translations (already dynamic imports)
- Only one translation file loaded per page

### Runtime Performance

- No runtime overhead (static generation)
- Language detection happens once per session (middleware)
- No client-side language switching overhead (full page navigation)

## Accessibility

### ARIA Labels

- Language switcher has `aria-label="Change language"`
- Language switcher button has `aria-expanded` state
- Each language link has `lang` attribute for screen readers

### Keyboard Navigation

- Language switcher fully keyboard accessible (tab, enter, escape)
- Focus management when dropdown opens/closes
- Skip-to-content link translated in each language

### Screen Reader Support

- `lang` attribute on `<html>` element set to current locale
- `dir` attribute supports RTL languages (if added in future)
- Translated skip links and ARIA labels

## Error Handling

### Missing Translations

- Fall back to English if translation key not found
- Log warning in development mode
- Return key itself as visible placeholder

### Invalid Locale in URL

- Middleware redirects to default locale (en-US)
- 301 permanent redirect to preserve SEO

### Missing Content Files

- Build fails if verified content missing for any locale
- Prevents deploying incomplete translations
- CI/CD catches this before production

## Future Enhancements

### Potential Additions (Out of Scope)

1. **RTL Language Support**: Add `ar-SA` (Arabic), `he-IL` (Hebrew) with proper `dir="rtl"`
2. **Translation Management Platform**: Integrate Crowdin, Lokalise, or similar
3. **User Language Preference**: Store preference in localStorage/cookie
4. **Inline Language Switcher**: Switch without page reload (SPA approach)
5. **Translation Status Dashboard**: Admin view showing translation completion %
6. **Auto-translate Draft**: Use AI to generate draft translations for review
7. **Region-Specific Variants**: en-GB, en-AU, fr-CA, pt-BR, es-MX, etc.

## Open Questions

1. **Translation Timeline**: When will translations be available for all 11 languages?
2. **Translation Team**: Who will handle translations and verification?
3. **Content Update Process**: How to notify translators when English content changes?
4. **Official Sources**: Are official photo requirements available in all target languages?

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Translation quality varies | High | Require native speaker verification, check against official sources |
| Translations drift from English | Medium | Date-stamp translations, flag stale translations |
| Incomplete translations | High | Block deployment of `needs-review` content, CI checks |
| Build time increases | Low | Parallel builds, incremental deployment |
| URL structure change breaks SEO | Medium | 301 redirects, keep old URLs for transition period |

## Success Criteria

1. All 11 languages generate static pages successfully
2. Root path redirects based on browser language
3. Language switcher works on all pages
4. SEO tags (hreflang, canonical) are correct
5. No hardcoded English strings in UI
6. Translation quality verified by native speakers
7. Build completes in < 5 minutes
8. No accessibility regressions
9. Lighthouse scores remain 90+ for all languages
10. Zero console errors in any language

## Approval

This design document is ready for review. Once approved, implementation will proceed via the writing-plans skill to create a detailed implementation plan.

---

**Document Version:** 1.0  
**Last Updated:** 2026-09-03  
**Reviewed By:** [Pending]  
**Approved By:** [Pending]
