import type { ImpersonationLog, Prisma } from '../../../prisma/generated/client';
import { db } from '../../utils/db';

/** ImpersonationLog with targetUser relation */
export type ImpersonationLogWithTargetUser = Prisma.ImpersonationLogGetPayload<{
  include: { targetUser: { select: { id: true; email: true; name: true } } };
}>;

/** ImpersonationLog with admin and targetUser relations */
type ImpersonationLogWithRelations = Prisma.ImpersonationLogGetPayload<{
  include: {
    admin: { select: { id: true; email: true; name: true } };
    targetUser: { select: { id: true; email: true; name: true } };
  };
}>;

/**
 * Repository for impersonation log database operations
 */
export class ImpersonationRepository {
  protected readonly db = db;

  /**
   * Create new impersonation log entry
   */
  async createLog(data: {
    adminId: string;
    targetUserId: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<ImpersonationLog> {
    return this.db.impersonationLog.create({
      data: {
        adminId: data.adminId,
        targetUserId: data.targetUserId,
        reason: data.reason,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * End active impersonation session
   * Finds most recent log with null endedAt and updates it
   */
  async endLog(adminId: string): Promise<ImpersonationLog | null> {
    const activeLog = await this.getActiveSession(adminId);
    if (!activeLog) {
      return null;
    }

    return this.db.impersonationLog.update({
      where: { id: activeLog.id },
      data: { endedAt: new Date() },
    });
  }

  /**
   * Get active impersonation session for admin
   * Returns most recent log with null endedAt
   */
  async getActiveSession(adminId: string): Promise<ImpersonationLogWithTargetUser | null> {
    return this.db.impersonationLog.findFirst({
      where: {
        adminId,
        endedAt: null,
      },
      orderBy: { startedAt: 'desc' },
      include: {
        targetUser: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  /**
   * Get impersonation logs with optional filters
   */
  async getLogs(filters?: {
    adminId?: string;
    targetUserId?: string;
    limit?: number;
  }): Promise<ImpersonationLogWithRelations[]> {
    return this.db.impersonationLog.findMany({
      where: {
        adminId: filters?.adminId,
        targetUserId: filters?.targetUserId,
      },
      include: {
        admin: {
          select: { id: true, email: true, name: true },
        },
        targetUser: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: filters?.limit || 100,
    });
  }
}

export const impersonationRepository = new ImpersonationRepository();
