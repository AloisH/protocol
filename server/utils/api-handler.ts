import type { H3Event } from 'h3';
import type { z } from 'zod';
import { serverAuth } from '../features/auth/auth-session';
import { db } from './db';
import { getLogger } from './logger';
import {
  addOrgContext,
  addUserContext,
  runWithContext,
  setRequestContext,
} from './request-context';

/**
 * API Handler Context - passed to all handlers
 */
export interface ApiHandlerContext<TBody = unknown> {
  event: H3Event;
  userId: string;
  body?: TBody;
}

/**
 * API Handler Options
 */
export interface ApiHandlerOptions {
  requiresAuth?: boolean;
  logContext?: string;
}

/**
 * Basic API handler with authentication
 * Use for endpoints without request body (GET, DELETE)
 */
export function defineApiHandler<TReturn>(
  handler: (context: ApiHandlerContext) => Promise<TReturn>,
  options: ApiHandlerOptions = {},
): (event: H3Event) => Promise<TReturn> {
  const { requiresAuth = true, logContext } = options;

  return defineEventHandler(async (event) => {
    return runWithContext(event, async () => {
      try {
        // Auth check
        if (requiresAuth) {
          const session = await serverAuth().getSession({ headers: event.headers });
          if (!session?.user) {
            throw createError({
              statusCode: 401,
              message: 'Unauthorized',
            });
          }

          // Enrich logging context with user info
          addUserContext({
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
          });

          // Check impersonation
          const sessionData = session.session as
            | { impersonatedBy?: string; currentOrganizationId?: string }
            | undefined;
          if (sessionData?.impersonatedBy) {
            setRequestContext({
              isImpersonated: true,
              impersonatorId: sessionData.impersonatedBy,
            });
          }

          // Add org if in session
          if (sessionData?.currentOrganizationId) {
            const orgMember = await db.organizationMember.findUnique({
              where: {
                userId_organizationId: {
                  userId: session.user.id,
                  organizationId: sessionData.currentOrganizationId,
                },
              },
              include: { organization: true },
            });

            if (orgMember) {
              addOrgContext(
                { id: orgMember.organization.id, slug: orgMember.organization.slug },
                orgMember.role,
              );
            }
          }

          const context: ApiHandlerContext = {
            event,
            userId: session.user.id,
          };

          return await handler(context);
        }

        // No auth required (rare)
        const context: ApiHandlerContext = {
          event,
          userId: '',
        };

        return await handler(context);
      }
      catch (error) {
        if (logContext) {
          getLogger().error({ context: logContext, error }, `API handler error: ${logContext}`);
        }
        throw error;
      }
    });
  });
}

/**
 * API handler with request body validation
 * Use for endpoints with request body (POST, PUT)
 */
export function defineValidatedApiHandler<TBody, TReturn>(
  schema: z.ZodType<TBody>,
  handler: (context: ApiHandlerContext<TBody>) => Promise<TReturn>,
  options: ApiHandlerOptions = {},
): (event: H3Event) => Promise<TReturn> {
  const { requiresAuth = true, logContext } = options;

  return defineEventHandler(async (event) => {
    return runWithContext(event, async () => {
      try {
        // Auth check
        if (requiresAuth) {
          const session = await serverAuth().getSession({ headers: event.headers });
          if (!session?.user) {
            throw createError({
              statusCode: 401,
              message: 'Unauthorized',
            });
          }

          // Enrich logging context with user info
          addUserContext({
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
          });

          // Check impersonation
          const sessionData = session.session as
            | { impersonatedBy?: string; currentOrganizationId?: string }
            | undefined;
          if (sessionData?.impersonatedBy) {
            setRequestContext({
              isImpersonated: true,
              impersonatorId: sessionData.impersonatedBy,
            });
          }

          // Add org if in session
          if (sessionData?.currentOrganizationId) {
            const orgMember = await db.organizationMember.findUnique({
              where: {
                userId_organizationId: {
                  userId: session.user.id,
                  organizationId: sessionData.currentOrganizationId,
                },
              },
              include: { organization: true },
            });

            if (orgMember) {
              addOrgContext(
                { id: orgMember.organization.id, slug: orgMember.organization.slug },
                orgMember.role,
              );
            }
          }

          // Read and validate body using h3 native helper
          const body = await readValidatedBody(event, data => schema.parse(data));

          const context: ApiHandlerContext<TBody> = {
            event,
            userId: session.user.id,
            body,
          };

          return await handler(context);
        }

        // No auth required (rare)
        const body = await readValidatedBody(event, data => schema.parse(data));

        const context: ApiHandlerContext<TBody> = {
          event,
          userId: '',
          body,
        };

        return await handler(context);
      }
      catch (error) {
        if (logContext) {
          getLogger().error({ context: logContext, error }, `API handler error: ${logContext}`);
        }
        throw error;
      }
    });
  });
}
