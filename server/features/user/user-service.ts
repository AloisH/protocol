import type {
  OnboardingState,
  OnboardingSteps,
  UpdateOnboardingInput,
  UpdateProfileInput,
  UserProfile,
} from '#shared/user';
import { scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { log } from '../../utils/request-context';
import { emailService } from '../email/email-service';
import { userRepository } from './user-repository';

const scryptAsync = promisify(scrypt);

/**
 * User service
 * Business logic for user operations
 */
export class UserService {
  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    // Return only public profile fields
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasPassword: !!user.password,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const updated = await userRepository.updateProfile(userId, input);

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      image: updated.image,
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      hasPassword: !!updated.password,
    };
  }

  /**
   * Get onboarding state
   */
  async getOnboardingState(userId: string): Promise<OnboardingState> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    return {
      completed: user.onboardingCompleted,
      steps: (user.onboardingSteps ?? {}) as OnboardingSteps,
      data: {
        bio: user.bio,
        company: user.company,
        useCase: user.useCase,
      },
    };
  }

  /**
   * Update onboarding data
   * Save step data and mark step as complete
   */
  async updateOnboarding(userId: string, input: UpdateOnboardingInput): Promise<OnboardingState> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    // Merge step completion into onboardingSteps
    const steps = (user.onboardingSteps ?? {}) as OnboardingSteps;
    steps[input.step] = true;

    // Update user with new data
    const updated = await userRepository.updateOnboarding(userId, {
      onboardingSteps: steps,
      ...input.data,
    });

    return {
      completed: updated.onboardingCompleted,
      steps: (updated.onboardingSteps ?? {}) as OnboardingSteps,
      data: {
        bio: updated.bio,
        company: updated.company,
        useCase: updated.useCase,
      },
    };
  }

  /**
   * Complete onboarding
   * Mark onboarding as completed
   */
  async completeOnboarding(userId: string): Promise<void> {
    await userRepository.updateOnboarding(userId, { onboardingCompleted: true });
  }

  /**
   * Skip onboarding
   * Mark onboarding as completed without saving data
   */
  async skipOnboarding(userId: string): Promise<void> {
    await userRepository.updateOnboarding(userId, { onboardingCompleted: true });
  }

  /**
   * Verify password against hash
   * Better Auth uses scrypt by default
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Parse Better Auth's scrypt hash format: algorithm:salt:hash
      const parts = hash.split(':');
      if (parts.length !== 3 || parts[0] !== 'scrypt' || !parts[1] || !parts[2]) {
        return false;
      }

      const salt = parts[1];
      const storedHash = parts[2];

      // Hash the input password with the same salt
      const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
      const derivedHash = derivedKey.toString('hex');

      // Timing-safe comparison
      const storedBuffer = Buffer.from(storedHash, 'hex');
      const derivedBuffer = Buffer.from(derivedHash, 'hex');

      return (
        storedBuffer.length === derivedBuffer.length && timingSafeEqual(storedBuffer, derivedBuffer)
      );
    }
    catch {
      return false;
    }
  }

  /**
   * Delete user account with password verification
   * For password-based accounts
   */
  async deleteAccountWithPassword(userId: string, password: string): Promise<void> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    if (!user.password) {
      throw createError({
        statusCode: 400,
        message: 'Account does not use password authentication',
      });
    }

    // Verify password
    const passwordValid = await this.verifyPassword(password, user.password);

    if (!passwordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid password',
      });
    }

    // Send deletion confirmation email (graceful degradation if fails)
    try {
      await emailService.sendAccountDeletion({
        to: user.email,
        name: user.name || undefined,
      });
    }
    catch {
      log.warn('Account deletion email failed');
      // Continue with deletion - account must be deleted regardless
    }

    await userRepository.deleteUser(userId);
  }

  /**
   * Delete user account with email verification
   * For OAuth accounts
   */
  async deleteAccountWithEmail(userId: string, email: string): Promise<void> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      });
    }

    if (user.password) {
      throw createError({
        statusCode: 400,
        message: 'Account uses password authentication',
      });
    }

    // Verify email matches
    if (user.email.toLowerCase() !== email.toLowerCase()) {
      throw createError({
        statusCode: 401,
        message: 'Email does not match',
      });
    }

    // Send deletion confirmation email (graceful degradation if fails)
    try {
      await emailService.sendAccountDeletion({
        to: user.email,
        name: user.name || undefined,
      });
    }
    catch {
      log.warn('Account deletion email failed');
      // Continue with deletion - account must be deleted regardless
    }

    await userRepository.deleteUser(userId);
  }
}

// Export singleton instance
export const userService = new UserService();
