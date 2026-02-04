import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '#shared': path.resolve(dirname, './shared'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['**/*.test.ts'],
    exclude: ['**/*.integration.test.ts', 'node_modules/**', '.nuxt/**', 'e2e/**'],
    setupFiles: ['./server/testing/setup.unit.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['.nuxt/**', 'node_modules/**', 'dist/**', '*.config.{js,ts}', 'prisma/**'],
    },
  },
});
