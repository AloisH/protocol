import 'better-auth';
import 'better-auth/client';

type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

declare module 'better-auth' {
  interface Session {
    user: User;
    session?: {
      id: string;
      userId: string;
      expiresAt: Date;
      token: string;
      createdAt: Date;
      updatedAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
      impersonatedBy?: string | null;
      currentOrganizationId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
    role: Role;
    onboardingCompleted: boolean;
    bio?: string | null;
    company?: string | null;
    useCase?: string | null;
    emailNotifications: boolean;
  }
}

declare module 'better-auth/client' {
  export { Session, User } from 'better-auth';
}
