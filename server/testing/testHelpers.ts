import type { H3Event } from 'h3';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { User } from '../../prisma/generated/client';
import { createEvent } from 'h3';
import { createTestSession } from './testFixtures';

/**
 * Mock event options for createMockEvent.
 */
export interface MockEventOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

/**
 * Minimal mock of IncomingMessage properties used by h3.
 * h3 reads: headers, method, url for request handling.
 */
interface MockIncomingMessageData {
  headers: Record<string, string | string[] | undefined>;
  method: string;
  url: string;
}

/**
 * Creates a minimal mock IncomingMessage for h3 event creation.
 * Cast is necessary because IncomingMessage requires stream properties
 * that h3 doesn't actually use for our test scenarios.
 */
function createMockIncomingMessage(
  method: string,
  headers: Record<string, string>,
): IncomingMessage {
  const mockData: MockIncomingMessageData = {
    headers: {
      ...headers,
      'content-type': headers['content-type'] || 'application/json',
    },
    method,
    url: '/',
  };
  // IncomingMessage extends stream.Readable which has many required methods.
  // For h3 event testing, only headers/method/url are actually read.
  return mockData as unknown as IncomingMessage;
}

/**
 * Minimal mock of ServerResponse properties used by h3.
 * h3 writes: statusCode, headers via setHeader/getHeader.
 */
interface MockServerResponseData {
  statusCode: number;
  statusMessage: string;
  headersSent: boolean;
  setHeader: () => void;
  getHeader: () => undefined;
  getHeaders: () => Record<string, never>;
  end: () => void;
}

/**
 * Creates a minimal mock ServerResponse for h3 event creation.
 * Cast is necessary because ServerResponse requires stream properties
 * that h3 doesn't actually use for our test scenarios.
 */
function createMockServerResponse(): ServerResponse {
  const mockData: MockServerResponseData = {
    statusCode: 200,
    statusMessage: 'OK',
    headersSent: false,
    setHeader: () => {},
    getHeader: () => undefined,
    getHeaders: () => ({}),
    end: () => {},
  };
  // ServerResponse extends stream.Writable which has many required methods.
  // For h3 event testing, only status and header methods are actually used.
  return mockData as unknown as ServerResponse;
}

/**
 * Create a mock H3 event for testing API handlers.
 *
 * Uses h3's createEvent with minimal mock IncomingMessage/ServerResponse.
 * This ensures the event has the correct class structure that h3 utilities expect.
 *
 * **Supported Options:**
 * - method: HTTP method (GET/POST/PUT/DELETE)
 * - headers: Request headers (including auth cookies)
 * - body: Request body (for POST/PUT)
 * - params: Route parameters (from [id] patterns)
 * - query: Query string parameters
 *
 * **Usage:** For authenticated requests, use createAuthEvent() instead.
 *
 * @param options - Event configuration options
 * @returns H3Event instance for testing
 * @see createAuthEvent for authenticated requests
 *
 * @example
 * ```typescript
 * // Unauthenticated request (for testing 401)
 * const event = createMockEvent({})
 * await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
 *
 * // Request with params
 * const event = createMockEvent({
 *   params: { id: 'todo-123' },
 *   headers: { cookie: '...' }
 * })
 * ```
 */
export function createMockEvent(options: MockEventOptions): H3Event {
  const { method = 'GET', headers = {}, body, params = {}, query = {} } = options;

  // Create mock req/res for h3's createEvent
  const mockReq = createMockIncomingMessage(method, headers);
  const mockRes = createMockServerResponse();

  // Use h3's official createEvent to get a proper H3Event instance
  const event = createEvent(mockReq, mockRes);

  // Set up context for h3 utilities (getRouterParam, getQuery)
  event.context.params = params;

  // Store body in context for handlers that use readBody
  // (actual readBody reads from stream, but our handlers use defineValidatedApiHandler
  // which has its own body handling)
  if (body !== undefined) {
    event.context._body = body;
  }

  // Store query in context
  if (Object.keys(query).length > 0) {
    event.context._query = query;
  }

  return event;
}

/**
 * Create an authenticated mock H3 event.
 *
 * Convenience wrapper that creates a session for the user and includes the
 * session token in the cookie header. Use this for testing authenticated
 * endpoints instead of manually creating sessions and cookies.
 *
 * **Automatic:**
 * - Creates test session for user
 * - Adds session cookie to headers
 * - Merges with any custom headers
 *
 * **Performance:** ~50ms (includes session creation)
 *
 * @param user - User object to authenticate as
 * @param options - Additional event options (merged with auth cookie)
 * @returns Authenticated H3Event mock
 * @see createMockEvent for unauthenticated requests
 *
 * @example
 * ```typescript
 * // Simple authenticated request
 * const user = await createTestUser()
 * const event = await createAuthEvent(user)
 * const response = await handler(event)
 *
 * // With body (POST/PUT)
 * const event = await createAuthEvent(user, {
 *   method: 'POST',
 *   body: { title: 'New Todo' }
 * })
 *
 * // With route params
 * const event = await createAuthEvent(user, {
 *   params: { id: todo.id }
 * })
 *
 * // With query params
 * const event = await createAuthEvent(user, {
 *   query: { filter: 'active', sort: 'date' }
 * })
 * ```
 */
export async function createAuthEvent(
  user: User,
  options?: Partial<Parameters<typeof createMockEvent>[0]>,
): Promise<H3Event> {
  const session = await createTestSession(user);

  return createMockEvent({
    ...options,
    headers: {
      ...options?.headers,
      cookie: `better-auth.session_token=${session.token}`,
    },
  });
}
