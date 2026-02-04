import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestUser } from '../../testing/testFixtures';
import { userRepository } from './user-repository';

describe('userRepository', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('findById', () => {
    it('returns user if found', async () => {
      const user = await createTestUser({ name: 'Test User' });

      const result = await userRepository.findById(user.id);

      expect(result?.id).toBe(user.id);
      expect(result?.name).toBe('Test User');
    });

    it('returns null if not found', async () => {
      const result = await userRepository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user if found', async () => {
      const user = await createTestUser();

      const result = await userRepository.findByEmail(user.email);

      expect(result?.id).toBe(user.id);
    });

    it('returns null if not found', async () => {
      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('updates name', async () => {
      const user = await createTestUser({ name: 'Old Name' });

      const result = await userRepository.updateProfile(user.id, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('updates image', async () => {
      const user = await createTestUser();

      const result = await userRepository.updateProfile(user.id, {
        image: 'https://example.com/avatar.png',
      });

      expect(result.image).toBe('https://example.com/avatar.png');
    });

    it('updates both name and image', async () => {
      const user = await createTestUser();

      const result = await userRepository.updateProfile(user.id, {
        name: 'New Name',
        image: 'https://example.com/avatar.png',
      });

      expect(result.name).toBe('New Name');
      expect(result.image).toBe('https://example.com/avatar.png');
    });
  });

  describe('updateOnboarding', () => {
    it('updates onboardingCompleted', async () => {
      const user = await createTestUser({ onboardingCompleted: false });

      const result = await userRepository.updateOnboarding(user.id, { onboardingCompleted: true });

      expect(result.onboardingCompleted).toBe(true);
    });

    it('updates onboarding profile fields', async () => {
      const user = await createTestUser();

      const result = await userRepository.updateOnboarding(user.id, {
        bio: 'Developer',
        company: 'Acme Inc',
        useCase: 'Project management',
      });

      expect(result.bio).toBe('Developer');
      expect(result.company).toBe('Acme Inc');
      expect(result.useCase).toBe('Project management');
    });
  });

  describe('deleteUser', () => {
    it('deletes user and returns true', async () => {
      const user = await createTestUser();

      const result = await userRepository.deleteUser(user.id);

      expect(result).toBe(true);
      const deleted = await db.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('updateRole', () => {
    it('updates user role', async () => {
      const user = await createTestUser({ role: 'USER' });

      const result = await userRepository.updateRole(user.id, 'ADMIN');

      expect(result.role).toBe('ADMIN');
    });

    it('can set SUPER_ADMIN role', async () => {
      const user = await createTestUser({ role: 'USER' });

      const result = await userRepository.updateRole(user.id, 'SUPER_ADMIN');

      expect(result.role).toBe('SUPER_ADMIN');
    });
  });

  describe('listAllUsers', () => {
    it('returns all users ordered by createdAt desc', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      const result = await userRepository.listAllUsers();

      expect(result.length).toBeGreaterThanOrEqual(2);
      // Most recent first
      const user1Index = result.findIndex(u => u.id === user1.id);
      const user2Index = result.findIndex(u => u.id === user2.id);
      expect(user2Index).toBeLessThan(user1Index);
    });
  });
});
