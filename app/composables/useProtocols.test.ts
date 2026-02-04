import { db } from '#shared/db/schema';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProtocols } from './useProtocols';

// Mock nanoid to return predictable IDs
vi.mock('nanoid', () => ({
  nanoid: () => 'test-id-123',
}));

describe('useProtocols', () => {
  beforeEach(async () => {
    // Clear DB before each test
    await db.protocols.clear();
  });

  it('initializes with empty protocols', () => {
    const { protocols } = useProtocols();
    expect(protocols.value).toEqual([]);
  });

  it('loads protocols from DB', async () => {
    // Add a test protocol
    await db.protocols.add({
      id: 'test-1',
      name: 'Test Protocol',
      description: 'A test',
      category: 'general',
      duration: 'daily',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { loadProtocols, protocols } = useProtocols();
    await loadProtocols();

    expect(protocols.value).toHaveLength(1);
    expect(protocols.value[0].name).toBe('Test Protocol');
  });

  it('creates a new protocol', async () => {
    const { createProtocol, protocols } = useProtocols();

    await createProtocol('Neck Training', 'Daily exercises', 'daily', 'exercise');

    expect(protocols.value).toHaveLength(1);
    expect(protocols.value[0].name).toBe('Neck Training');
    expect(protocols.value[0].status).toBe('active');
  });

  it('updates a protocol', async () => {
    const { createProtocol, updateProtocol, protocols } = useProtocols();

    const protocol = await createProtocol('Original', 'Description', 'daily');

    await updateProtocol(protocol.id, { name: 'Updated' });

    expect(protocols.value[0].name).toBe('Updated');
  });

  it('deletes a protocol', async () => {
    const { createProtocol, deleteProtocol, protocols } = useProtocols();

    const protocol = await createProtocol('To Delete', 'Description', 'daily');
    expect(protocols.value).toHaveLength(1);

    await deleteProtocol(protocol.id);

    expect(protocols.value).toHaveLength(0);
  });

  it('archives a protocol', async () => {
    const { createProtocol, archiveProtocol, protocols } = useProtocols();

    const protocol = await createProtocol('To Archive', 'Description', 'daily');
    expect(protocols.value[0].status).toBe('active');

    await archiveProtocol(protocol.id);

    expect(protocols.value[0].status).toBe('completed');
  });

  it('sets error on invalid data', async () => {
    const { createProtocol, error } = useProtocols();

    try {
      await createProtocol('', 'Empty name should fail', 'daily');
    }
    catch {
      // Expected
    }

    expect(error.value).toBeTruthy();
  });
});
