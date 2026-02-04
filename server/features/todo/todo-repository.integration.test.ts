import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestOrg, createTestOrgMember, createTestTodo, createTestUser } from '../../testing/testFixtures';
import { todoRepository } from './todo-repository';

describe('todoRepository (Integration)', () => {
  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('findByOrganizationId', () => {
    it('returns todos for specific organization', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');
      const todo1 = await createTestTodo(org.id, user.id, { title: 'Task 1' });
      const todo2 = await createTestTodo(org.id, user.id, { title: 'Task 2' });

      const { todos, total } = await todoRepository.findByOrganizationId(org.id);

      expect(todos).toHaveLength(2);
      expect(total).toBe(2);
      expect(todos.map(t => t.id)).toContain(todo1.id);
      expect(todos.map(t => t.id)).toContain(todo2.id);
    });

    it('does not return other organizations todos', async () => {
      const user = await createTestUser();
      const org1 = await createTestOrg();
      const org2 = await createTestOrg();
      await createTestOrgMember(user.id, org1.id, 'MEMBER');
      await createTestOrgMember(user.id, org2.id, 'MEMBER');
      await createTestTodo(org1.id, user.id);
      await createTestTodo(org2.id, user.id);

      const { todos, total } = await todoRepository.findByOrganizationId(org1.id);

      expect(todos).toHaveLength(1);
      expect(total).toBe(1);
      expect(todos.at(0)?.organizationId).toBe(org1.id);
    });

    it('filters active todos', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestTodo(org.id, user.id, { completed: false });
      await createTestTodo(org.id, user.id, { completed: true });

      const { todos, total } = await todoRepository.findByOrganizationId(org.id, { filter: 'active' });

      expect(todos).toHaveLength(1);
      expect(total).toBe(1);
      expect(todos.at(0)?.completed).toBe(false);
    });

    it('filters completed todos', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestTodo(org.id, user.id, { completed: false });
      await createTestTodo(org.id, user.id, { completed: true });

      const { todos, total } = await todoRepository.findByOrganizationId(org.id, { filter: 'completed' });

      expect(todos).toHaveLength(1);
      expect(total).toBe(1);
      expect(todos.at(0)?.completed).toBe(true);
    });

    it('sorts by date descending by default', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo1 = await createTestTodo(org.id, user.id, { title: 'First' });
      const todo2 = await createTestTodo(org.id, user.id, { title: 'Second' });

      const { todos } = await todoRepository.findByOrganizationId(org.id);

      // Most recent first (todo2 created after todo1)
      expect(todos.at(0)?.id).toBe(todo2.id);
      expect(todos.at(1)?.id).toBe(todo1.id);
    });

    it('sorts by title when specified', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestTodo(org.id, user.id, { title: 'Zebra' });
      await createTestTodo(org.id, user.id, { title: 'Apple' });

      const { todos } = await todoRepository.findByOrganizationId(org.id, { sort: 'title' });

      expect(todos.at(0)?.title).toBe('Apple');
      expect(todos.at(1)?.title).toBe('Zebra');
    });

    it('paginates results', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      for (let i = 0; i < 15; i++) {
        await createTestTodo(org.id, user.id, { title: `Task ${i}` });
      }

      const page1 = await todoRepository.findByOrganizationId(org.id, { page: 1, limit: 10 });
      const page2 = await todoRepository.findByOrganizationId(org.id, { page: 2, limit: 10 });

      expect(page1.todos).toHaveLength(10);
      expect(page1.total).toBe(15);
      expect(page2.todos).toHaveLength(5);
      expect(page2.total).toBe(15);
    });
  });

  describe('findById', () => {
    it('finds todo by id for correct organization', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { title: 'Find me' });

      const result = await todoRepository.findById(todo.id, org.id);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Find me');
    });

    it('returns null if todo belongs to different organization', async () => {
      const user = await createTestUser();
      const org1 = await createTestOrg();
      const org2 = await createTestOrg();
      const todo = await createTestTodo(org1.id, user.id);

      const result = await todoRepository.findById(todo.id, org2.id);

      expect(result).toBeNull();
    });

    it('returns null if todo does not exist', async () => {
      const org = await createTestOrg();

      const result = await todoRepository.findById('nonexistent-id', org.id);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates todo with title only', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();

      const result = await todoRepository.create(org.id, user.id, { title: 'New task' });

      expect(result.id).toBeDefined();
      expect(result.title).toBe('New task');
      expect(result.description).toBeNull();
      expect(result.completed).toBe(false);
      expect(result.organizationId).toBe(org.id);
      expect(result.createdBy).toBe(user.id);
    });

    it('creates todo with description', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();

      const result = await todoRepository.create(org.id, user.id, {
        title: 'Task with details',
        description: 'More info here',
      });

      expect(result.title).toBe('Task with details');
      expect(result.description).toBe('More info here');
    });
  });

  describe('update', () => {
    it('updates todo title', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { title: 'Original' });

      const result = await todoRepository.update(todo.id, org.id, { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(result.id).toBe(todo.id);
    });

    it('updates todo completed status', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { completed: false });

      const result = await todoRepository.update(todo.id, org.id, { completed: true });

      expect(result.completed).toBe(true);
    });

    it('updates multiple fields', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id);

      const result = await todoRepository.update(todo.id, org.id, {
        title: 'Updated Title',
        description: 'Updated Description',
        completed: true,
      });

      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated Description');
      expect(result.completed).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes todo', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id);

      const result = await todoRepository.delete(todo.id);

      expect(result.id).toBe(todo.id);

      // Verify deleted
      const found = await todoRepository.findById(todo.id, org.id);
      expect(found).toBeNull();
    });
  });
});
