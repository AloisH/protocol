/**
 * User types
 */

export interface OnboardingState {
  completed: boolean;
  steps: Record<string, boolean>;
  data: {
    bio?: string | null;
    company?: string | null;
    useCase?: string | null;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  hasPassword: boolean;
}

/** User for admin panel (dates as string|Date for JSON serialization) */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  banned: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
