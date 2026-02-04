/**
 * Test setup - provides globals that are auto-imported by Nuxt/H3
 *
 * Nuxt auto-imports createError from h3 which provides the type.
 * This file provides a runtime fallback for test environments where
 * the Nuxt runtime isn't available.
 */

interface ErrorOptions {
  statusCode?: number;
  statusMessage?: string;
  message?: string;
  data?: unknown;
}

class TestH3Error extends Error {
  statusCode: number;
  statusMessage?: string;
  data?: unknown;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message);
    this.statusCode = options.statusCode || 500;
    this.statusMessage = options.statusMessage;
    this.data = options.data;
    this.name = 'H3Error';
  }
}

// Runtime fallback: define createError if not already available from Nuxt
// Type comes from h3 via Nuxt auto-imports, we just provide the implementation
const g = globalThis as Record<string, unknown>;
if (typeof g.createError === 'undefined') {
  g.createError = (input: string | ErrorOptions): TestH3Error => {
    if (typeof input === 'string') {
      return new TestH3Error(input);
    }
    return new TestH3Error(input.message || input.statusMessage || 'Error', input);
  };
}

export {};
