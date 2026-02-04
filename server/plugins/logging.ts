import type { LogContext } from '../utils/logger';
import { generateRequestId, getLogger } from '../utils/logger';
import { shouldSampleRequest, shouldSampleRequestDev } from '../utils/tail-sampling';

const isDev = process.env.NODE_ENV === 'development';
const logger = getLogger();

export default defineNitroPlugin((_nitroApp) => {
  // Hook: Request start
  _nitroApp.hooks.hook('request', (event) => {
    const url = event.node.req.url!;

    // Only log API requests, skip static assets and icon requests
    const shouldLog
      = url.startsWith('/api/')
        && !url.startsWith('/api/_nuxt_icon')
        && !url.startsWith('/api/auth/session');

    if (!shouldLog)
      return;

    const requestId = generateRequestId();
    const startTime = Date.now();

    const initialContext: Partial<LogContext> = {
      requestId,
      startTime,
      method: event.node.req.method!,
      url,
      ip:
        (event.node.req.headers['x-forwarded-for'] as string)
        || event.node.req.socket.remoteAddress,
      userAgent: event.node.req.headers['user-agent'] as string,
    };

    event.context.requestId = requestId;
    event.context.logContext = initialContext;
  });

  // Hook: Request end
  _nitroApp.hooks.hook('afterResponse', (event) => {
    const context = event.context.logContext as Partial<LogContext> | undefined;
    if (!context)
      return;

    // Skip if already logged by error hook
    if (context.error)
      return;

    // Finalize
    context.endTime = Date.now();
    context.durationMs = context.endTime - (context.startTime || context.endTime);
    context.statusCode = event.node.res.statusCode;

    // Apply tail sampling
    const samplingFn = isDev ? shouldSampleRequestDev : shouldSampleRequest;
    const { shouldLog, reason } = samplingFn(context);
    context.sampled = shouldLog;
    context.samplingReason = reason;

    if (shouldLog) {
      const level
        = context.statusCode && context.statusCode >= 500
          ? 'error'
          : context.statusCode && context.statusCode >= 400
            ? 'warn'
            : 'info';

      logger[level](
        context as LogContext,
        `${context.method} ${context.url} ${context.statusCode} ${context.durationMs}ms`,
      );
    }
  });

  // Hook: Error handling - log immediately since afterResponse may not fire
  _nitroApp.hooks.hook('error', (error, { event }) => {
    const context = event?.context.logContext as Partial<LogContext> | undefined;

    const errorInfo = {
      message: error.message,
      stack: isDev ? error.stack : undefined,
      code: 'code' in error ? (error.code as string) : undefined,
    };
    const statusCode
      = 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;

    if (context) {
      context.error = errorInfo;
      context.statusCode = statusCode;
      context.endTime = Date.now();
      context.durationMs = context.endTime - (context.startTime || context.endTime);

      // Log immediately - don't wait for afterResponse which may not fire
      logger.error(
        context as LogContext,
        `${context.method} ${context.url} ${statusCode} ${context.durationMs}ms ERROR: ${error.message}`,
      );
    }
    else {
      // No context (non-API request or early error) - log basic info
      logger.error(
        { error: errorInfo, statusCode, url: event?.node.req.url },
        `Request error: ${error.message}`,
      );
    }
  });
});
