import type { LogContext } from './logger';

class P99Tracker {
  private durations: number[] = [];
  private maxSize = 1000;
  private p99Threshold = 1000; // Initial 1s

  update(duration: number) {
    this.durations.push(duration);
    if (this.durations.length > this.maxSize) {
      this.durations.shift();
    }

    // Recalc p99 every 100 requests
    if (this.durations.length % 100 === 0 && this.durations.length >= 100) {
      const sorted = [...this.durations].sort((a, b) => a - b);
      const p99Index = Math.floor(sorted.length * 0.99);
      this.p99Threshold = sorted[p99Index] ?? this.p99Threshold;
    }
  }

  getThreshold(): number {
    return this.p99Threshold;
  }
}

const p99Tracker = new P99Tracker();
const SAMPLE_RATE = Number.parseFloat(process.env.LOG_SAMPLE_RATE || '0.05');

export function shouldSampleRequest(context: Partial<LogContext>): {
  shouldLog: boolean;
  reason: LogContext['samplingReason'];
} {
  const { statusCode, durationMs } = context;

  // Always log errors
  if (statusCode && statusCode >= 400) {
    return { shouldLog: true, reason: 'error' };
  }

  // Always log slow (>p99)
  if (durationMs && durationMs > p99Tracker.getThreshold()) {
    p99Tracker.update(durationMs);
    return { shouldLog: true, reason: 'slow' };
  }

  // Update tracker
  if (durationMs) {
    p99Tracker.update(durationMs);
  }

  // Random sample
  if (Math.random() < SAMPLE_RATE) {
    return { shouldLog: true, reason: 'random' };
  }

  return { shouldLog: false, reason: 'all' };
}

export function shouldSampleRequestDev(): {
  shouldLog: boolean;
  reason: LogContext['samplingReason'];
} {
  return { shouldLog: true, reason: 'all' };
}
