import { UAParser } from 'ua-parser-js';
import { sessionRepository } from './session-repository';

export interface SessionWithMetadata {
  id: string;
  isCurrent: boolean;
  browser: string;
  os: string;
  device: string;
  ipAddress: string | null;
  createdAt: Date;
  lastActive: Date;
}

/**
 * Session service
 * Business logic for session management
 */
export class SessionService {
  /**
   * List all sessions for user with metadata
   */
  async listSessions(userId: string, currentToken: string): Promise<SessionWithMetadata[]> {
    const sessions = await sessionRepository.findByUserId(userId);

    return sessions.map((session) => {
      const parser = new UAParser(session.userAgent || undefined);
      const result = parser.getResult();

      return {
        id: session.id,
        isCurrent: session.token === currentToken,
        browser: result.browser.name || 'Unknown Browser',
        os: result.os.name || 'Unknown OS',
        device: this.getDeviceType(result.device.type),
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastActive: session.updatedAt,
      };
    });
  }

  /**
   * Revoke a specific session
   * Prevents revoking current session
   */
  async revokeSession(sessionId: string, userId: string, currentToken: string): Promise<void> {
    const session = await sessionRepository.findById(sessionId, userId);

    if (!session) {
      throw createError({
        statusCode: 404,
        message: 'Session not found',
      });
    }

    if (session.token === currentToken) {
      throw createError({
        statusCode: 400,
        message: 'Cannot revoke current session',
      });
    }

    const deleted = await sessionRepository.deleteById(sessionId, userId);
    if (!deleted) {
      throw createError({
        statusCode: 500,
        message: 'Failed to revoke session',
      });
    }
  }

  /**
   * Revoke all sessions except current
   */
  async revokeOtherSessions(currentToken: string, userId: string): Promise<number> {
    return sessionRepository.deleteAllExcept(currentToken, userId);
  }

  /**
   * Set current organization in session
   * Verifies user is member of organization
   */
  async setCurrentOrganization(
    token: string,
    userId: string,
    organizationId: string | null,
  ): Promise<void> {
    // If setting org (not clearing), verify membership
    if (organizationId) {
      const { organizationRepository } = await import('../organization/organization-repository');
      const membership = await organizationRepository.findMembership(userId, organizationId);

      if (!membership) {
        throw createError({
          statusCode: 403,
          message: 'You are not a member of this organization',
        });
      }
    }

    // Update session
    await sessionRepository.updateCurrentOrganization(token, userId, organizationId);
  }

  /**
   * Get device type from UA parser result
   */
  private getDeviceType(deviceType?: string): string {
    if (!deviceType)
      return 'Desktop';
    if (deviceType === 'mobile')
      return 'Mobile';
    if (deviceType === 'tablet')
      return 'Tablet';
    return 'Desktop';
  }
}

// Export singleton instance
export const sessionService = new SessionService();
