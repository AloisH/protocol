import type { H3Event } from 'h3';
import type { AuditEvent, AuditStatus, Prisma } from '../../prisma/generated/client';
import { db } from './db';
import { getLogger } from './logger';

export interface AuditLogOptions {
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Log auth event to audit log
 */
export async function logAuthEvent(
  event: AuditEvent,
  status: AuditStatus,
  options: AuditLogOptions,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        event,
        status,
        userId: options.userId,
        email: options.email,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: options.metadata,
      },
    });
  }
  catch (error) {
    // Don't throw - audit logging should not break auth flow
    getLogger().error({ error, event, status }, 'Failed to log audit event');
  }
}

/**
 * Extract request metadata for audit logging
 */
export function getAuditMetadata(event: H3Event): Pick<AuditLogOptions, 'ipAddress' | 'userAgent'> {
  const ipAddress = getRequestIP(event) || 'unknown';
  const userAgent = getHeader(event, 'user-agent') || 'unknown';

  return { ipAddress, userAgent };
}
