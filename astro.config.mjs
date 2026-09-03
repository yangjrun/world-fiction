import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// TODO(deploy): replace with the real apex domain before the first production build.
// `site` must be correct or sitemap.xml and canonical URLs ship wrong absolute URLs.
const SITE = process.env.SITE_URL ?? 'https://example.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  i18n: {
    defaultLocale: 'en-US',
    locales: ['de-DE', 'en-US', 'es-ES', 'fr-FR', 'it-IT', 'ja-JP', 'ko-KR', 'nl-NL', 'pt-PT', 'zh-CN', 'zh-TW'],
    routing: {
      // Every URL carries a locale prefix, including the default locale.
      prefixDefaultLocale: true,
      // The middleware owns the root redirect; Astro must not duplicate it.
      redirectToDefaultLocale: false,
    },
  },
  integrations: [vue(), sitemap()],
  build: {
    // One directory-free .html per route keeps canonical URLs stable.
    format: 'file',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    optimizeDeps: {
      // These ship their own WASM and must not be pre-bundled.
      exclude: ['onnxruntime-web', '@mediapipe/tasks-vision'],
    },
  },
});
