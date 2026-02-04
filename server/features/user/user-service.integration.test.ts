import { scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestUser } from '../../testing/testFixtures';
import { log } from '../../utils/request-context';
import { emailService } from '../email/email-service';
import { UserService } from './user-service';

const scryptAsync = promisify(scrypt);

// Mock only external services, not the repository
vi.mock('../email/email-service', () => ({
  emailService: {
    sendAccountDeletion: vi.fn(),
  },
}));

vi.mock('../../utils/request-context', () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockEmailService = vi.mocked(emailService);

describe('userService', () => {
  const userService = new UserService();

  beforeEach(async () => {
    await startTransaction();
    vi.clearAllMocks();
    mockEmailService.sendAccountDeletion.mockResolvedValue({ id: 'test-email-id' });
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('getProfile', () => {
    it('returns user profile', async () => {
      const user = await createTestUser({ name: 'Test User' });

      const result = await userService.getProfile(user.id);

      expect(result.id).toBe(user.id);
      expect(result.name).toBe('Test User');
      expect(result.email).toBe(user.email);
      expect(result.hasPassword).toBe(true);
    });

    it('throws 404 if user not found', async () => {
      await expect(userService.getProfile('nonexistent-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('updateProfile', () => {
    it('updates user name', async () => {
      const user = await createTestUser({ name: 'Old Name' });

      const result = await userService.updateProfile(user.id, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('updates user image', async () => {
      const user = await createTestUser();

      const result = await userService.updateProfile(user.id, {
        name: user.name,
        image: 'https://example.com/avatar.png',
      });

      expect(result.image).toBe('https://example.com/avatar.png');
    });
  });

  describe('deleteAccountWithPassword', () => {
    async function createUserWithPassword(password: string) {
      const salt = 'testsalt';
      const hash = ((await scryptAsync(password, salt, 64)) as Buffer).toString('hex');
      const hashedPassword = `scrypt:${salt}:${hash}`;
      return createTestUser({ password: hashedPassword });
    }

    it('deletes account with correct password', async () => {
      const password = 'testpassword123';
      const user = await createUserWithPassword(password);

      await userService.deleteAccountWithPassword(user.id, password);

      const deleted = await db.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });

    it('sends deletion email before deleting', async () => {
      const password = 'testpassword123';
      const user = await createUserWithPassword(password);

      await userService.deleteAccountWithPassword(user.id, password);

      expect(mockEmailService.sendAccountDeletion).toHaveBeenCalledWith({
        to: user.email,
        name: user.name,
      });
    });

    it('throws 401 with incorrect password', async () => {
      const user = await createUserWithPassword('correctpassword');

      await expect(
        userService.deleteAccountWithPassword(user.id, 'wrongpassword'),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid password',
      });
    });

    it('throws 400 for OAuth account without password', async () => {
      const user = await createTestUser({ password: null });

      await expect(
        userService.deleteAccountWithPassword(user.id, 'anypassword'),
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Account does not use password authentication',
      });
    });

    it('still deletes account even if email fails', async () => {
      const password = 'testpassword123';
      const user = await createUserWithPassword(password);
      mockEmailService.sendAccountDeletion.mockRejectedValue(new Error('Email service error'));

      await userService.deleteAccountWithPassword(user.id, password);

      const deleted = await db.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });

    it('logs warning if email fails', async () => {
      const password = 'testpassword123';
      const user = await createUserWithPassword(password);
      mockEmailService.sendAccountDeletion.mockRejectedValue(new Error('Email service error'));

      await userService.deleteAccountWithPassword(user.id, password);

      expect(log.warn).toHaveBeenCalledWith('Account deletion email failed');
    });
  });

  describe('deleteAccountWithEmail', () => {
    it('deletes OAuth account with matching email', async () => {
      const user = await createTestUser({ password: null });

      await userService.deleteAccountWithEmail(user.id, user.email);

      const deleted = await db.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });

    it('sends deletion email before deleting', async () => {
      const user = await createTestUser({ password: null, name: 'OAuth User' });

      await userService.deleteAccountWithEmail(user.id, user.email);

      expect(mockEmailService.sendAccountDeletion).toHaveBeenCalledWith({
        to: user.email,
        name: 'OAuth User',
      });
    });

    it('uses undefined for name if user.name is empty', async () => {
      const user = await createTestUser({ password: null, name: '' });

      await userService.deleteAccountWithEmail(user.id, user.email);

      expect(mockEmailService.sendAccountDeletion).toHaveBeenCalledWith({
        to: user.email,
        name: undefined, // empty string is falsy, converted to undefined
      });
    });

    it('throws 400 for password account', async () => {
      const user = await createTestUser(); // has password by default

      await expect(userService.deleteAccountWithEmail(user.id, user.email)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Account uses password authentication',
      });
    });

    it('throws 401 with non-matching email', async () => {
      const user = await createTestUser({ password: null });

      await expect(
        userService.deleteAccountWithEmail(user.id, 'wrong@example.com'),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Email does not match',
      });
    });

    it('still deletes account even if email fails', async () => {
      const user = await createTestUser({ password: null });
      mockEmailService.sendAccountDeletion.mockRejectedValue(new Error('Email service error'));

      await userService.deleteAccountWithEmail(user.id, user.email);

      const deleted = await db.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });

    it('logs warning if email fails', async () => {
      const user = await createTestUser({ password: null });
      mockEmailService.sendAccountDeletion.mockRejectedValue(new Error('Email service error'));

      await userService.deleteAccountWithEmail(user.id, user.email);

      expect(log.warn).toHaveBeenCalledWith('Account deletion email failed');
    });
  });
});
