import { describe, expect, it } from 'vitest';
import { shouldSampleRequest } from './tail-sampling';

describe('tail Sampling', () => {
  it('always samples errors', () => {
    const result = shouldSampleRequest({ statusCode: 500, durationMs: 10 });
    expect(result.shouldLog).toBe(true);
    expect(result.reason).toBe('error');
  });

  it('samples slow requests', () => {
    // Populate with fast requests
    for (let i = 0; i < 1000; i++) {
      shouldSampleRequest({ statusCode: 200, durationMs: 100 });
    }

    // Slow should be sampled
    const result = shouldSampleRequest({ statusCode: 200, durationMs: 5000 });
    expect(result.shouldLog).toBe(true);
    expect(result.reason).toBe('slow');
  });

  it('samples randomly at configured rate', () => {
    let sampled = 0;
    for (let i = 0; i < 1000; i++) {
      const result = shouldSampleRequest({ statusCode: 200, durationMs: 100 });
      if (result.reason === 'random')
        sampled++;
    }

    // Should be ~5% (allow variance)
    expect(sampled).toBeGreaterThan(30);
    expect(sampled).toBeLessThan(70);
  });
});
