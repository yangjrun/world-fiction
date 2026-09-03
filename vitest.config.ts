import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Astro's own Vite config aliases this virtual specifier to the same file;
      // plain vitest has no such alias, so mirror it exactly. Do not point at
      // `astro/middleware`, which exports a superset — code importing something
      // only that superset has would pass here and fail `astro build`.
      'astro:middleware': 'astro/virtual-modules/middleware.js',
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Only the pure domain core is unit-testable without a browser.
      // Browser adapters (MediaPipe, ONNX, Canvas) are covered by the e2e recipe.
      include: ['src/lib/photo/**/*.ts'],
      exclude: ['src/lib/photo/**/*.browser.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
