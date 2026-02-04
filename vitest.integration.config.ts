import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file for DATABASE_URL
const envPath = path.resolve(dirname, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      const value = match[2]
        .replace(/\s*#.*$/, '') // Remove inline comments
        .replace(/^["']|["']$/g, '') // Remove quotes
        .trim();
      process.env[match[1]] = value;
    }
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '#shared': path.resolve(dirname, './shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules/**', '.nuxt/**', 'e2e/**'],
    setupFiles: ['./server/testing/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
