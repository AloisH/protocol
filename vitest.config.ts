import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file for DATABASE_URL (needed for integration tests)
const envPath = path.resolve(dirname, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    const key = match?.[1];
    const rawValue = match?.[2];
    if (key && rawValue !== undefined && !process.env[key]) {
      const value = rawValue
        .replace(/\s*#.*$/, '')
        .replace(/^["']|["']$/g, '')
        .trim();
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '#shared': path.resolve(dirname, './shared'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['.nuxt/**', 'node_modules/**', 'dist/**', '*.config.{js,ts}', 'prisma/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
