import { Resend } from 'resend';
import { getLogger } from '../../utils/logger';

// Symbol key for HMR-safe singleton
const RESEND_KEY = Symbol.for('bistro.resend');

function createResendClient(): Resend | undefined {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    getLogger().warn('RESEND_API_KEY not set - email disabled');
    return undefined;
  }

  return new Resend(apiKey);
}

function getResend(): Resend | undefined {
  const cached = (globalThis as Record<symbol, unknown>)[RESEND_KEY] as Resend | undefined;
  if (cached !== undefined) {
    return cached;
  }

  const client = createResendClient();
  (globalThis as Record<symbol, unknown>)[RESEND_KEY] = client;
  return client;
}

export const resend = getResend();
