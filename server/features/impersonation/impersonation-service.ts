import type { StartImpersonationInput } from '#shared/impersonation';
import type { H3Event } from 'h3';
import type { ImpersonationLog } from '../../../prisma/generated/client';
import type { ImpersonationLogWithTargetUser } from './impersonation-repository';
import { db } from '../../utils/db';
import { getLogger } from '../../utils/logger';
import { log } from '../../utils/request-context';
import { auth } from '../auth/auth-config';
import { impersonationRepository } from './impersonation-repository';

/**
 * Service for impersonation business logic
 */
export class ImpersonationService {
  /**
   * Start impersonating a user
   *
   * @throws 404 if target user not found
   * @throws 403 if trying to impersonate SUPER_ADMIN
   */
  async startImpersonation(
    adminId: string,
    input: StartImpersonationInput,
    event: H3Event,
  ): Promise<ImpersonationLog> {
    // Validate target user exists
    const targetUser = await db.user.findUnique({
      where: { id: input.userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      throw createError({
        statusCode: 404,
        message: 'Target user not found',
      });
    }

    // Prevent impersonating SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'Cannot impersonate super admin',
      });
    }

    // End any existing active impersonation for this admin
    await impersonationRepository.endLog(adminId);

    // Extract IP and user agent from request
    const ipAddress
      = getHeader(event, 'x-forwarded-for') || getHeader(event, 'x-real-ip') || undefined;
    const userAgent = getHeader(event, 'user-agent') || undefined;

    // Create audit log
    const log = await impersonationRepository.createLog({
      adminId,
      targetUserId: input.userId,
      reason: input.reason,
      ipAddress,
      userAgent,
    });

    // Call Better Auth impersonation API with asResponse to get cookies
    try {
      const response = await auth.api.impersonateUser({
        body: { userId: input.userId },
        headers: event.headers,
        asResponse: true,
      });

      // Set cookies from Better Auth response to client
      const cookies = response.headers.getSetCookie();
      for (const cookie of cookies) {
        appendResponseHeader(event, 'set-cookie', cookie);
      }
    }
    catch (error) {
      // Log error for debugging
      getLogger().error(
        { error, adminId, targetUserId: input.userId },
        'Better Auth impersonation failed',
      );
      // If Better Auth fails, mark log as ended
      await impersonationRepository.endLog(adminId);
      throw createError({
        statusCode: 500,
        message: 'Failed to start impersonation session',
        data: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }

    return log;
  }

  /**
   * Stop impersonating - admin stops their active impersonation session
   * Handles both active impersonation and orphaned logs (expired sessions)
   *
   * @param adminId - The admin user's ID
   * @throws 400 if no active impersonation
   */
  async stopImpersonation(adminId: string, event: H3Event): Promise<void> {
    // Find active impersonation by adminId (reuse same logic as getActiveImpersonation)
    const activeLog = await this.getActiveImpersonation(adminId);

    if (!activeLog) {
      throw createError({
        statusCode: 400,
        message: 'No active impersonation session',
      });
    }

    // Try to stop Better Auth session (may fail if session already expired/cleared)
    try {
      const response = await auth.api.stopImpersonating({
        headers: event.headers,
        asResponse: true,
      });

      // Set cookies from Better Auth response to restore admin session
      const cookies = response.headers.getSetCookie();
      for (const cookie of cookies) {
        appendResponseHeader(event, 'set-cookie', cookie);
      }
    }
    catch {
      // Session may already be expired or cleared - that's ok, just log it
      log.warn('Better Auth impersonation already stopped');
      // Continue to end the audit log regardless
    }

    // Always end audit log (even if Better Auth call failed)
    await impersonationRepository.endLog(adminId);
  }

  /**
   * Get active impersonation session
   */
  async getActiveImpersonation(adminId: string): Promise<ImpersonationLogWithTargetUser | null> {
    return impersonationRepository.getActiveSession(adminId);
  }

  /**
   * Get impersonation audit logs
   */
  async getAuditLogs(filters?: {
    adminId?: string;
    targetUserId?: string;
    limit?: number;
  }): Promise<ImpersonationLog[]> {
    return impersonationRepository.getLogs(filters);
  }
}

export const impersonationService = new ImpersonationService();
