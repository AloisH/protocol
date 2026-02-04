import type { Session } from '../../../prisma/generated/client';
import { db } from '../../utils/db';

/**
 * Session repository
 * Handles session-related database queries
 * ALL methods are user-scoped
 */
export class SessionRepository {
  protected readonly db = db;

  /**
   * Find all sessions for a user
   * Ordered by most recent first
   */
  async findByUserId(userId: string): Promise<Session[]> {
    return this.db.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find session by ID with ownership check
   * Returns null if not found or user doesn't own it
   */
  async findById(id: string, userId: string): Promise<Session | null> {
    return this.db.session.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Delete session by ID with ownership check
   * Returns true if deleted, false if not found or unauthorized
   */
  async deleteById(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) {
      return false;
    }

    await this.db.session.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Delete all sessions except current one
   * Returns count of deleted sessions
   */
  async deleteAllExcept(currentToken: string, userId: string): Promise<number> {
    const result = await this.db.session.deleteMany({
      where: {
        userId,
        token: { not: currentToken },
      },
    });
    return result.count;
  }

  /**
   * Update current organization for session
   */
  async updateCurrentOrganization(
    token: string,
    userId: string,
    organizationId: string | null,
  ): Promise<Session> {
    // Find session by token and user
    const session = await this.db.session.findFirst({
      where: { token, userId },
    });

    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found',
      });
    }

    // Update current organization
    return this.db.session.update({
      where: { id: session.id },
      data: { currentOrganizationId: organizationId },
    });
  }
}

// Export singleton instance
export const sessionRepository = new SessionRepository();
