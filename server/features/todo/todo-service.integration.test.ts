import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, rollbackTransaction, startTransaction } from '../../testing/testDb';
import { createTestOrg, createTestOrgMember, createTestTodo, createTestUser } from '../../testing/testFixtures';
import { TodoService } from './todo-service';

describe('todoService', () => {
  const service = new TodoService();

  beforeEach(async () => {
    await startTransaction();
  });

  afterEach(async () => {
    await rollbackTransaction();
  });

  describe('listTodos', () => {
    it('returns paginated organization todos', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestOrgMember(user.id, org.id, 'MEMBER');
      await createTestTodo(org.id, user.id, { title: 'Todo 1' });
      await createTestTodo(org.id, user.id, { title: 'Todo 2' });

      const result = await service.listTodos(org.id);

      expect(result.todos).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('filters active todos', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestTodo(org.id, user.id, { title: 'Active', completed: false });
      await createTestTodo(org.id, user.id, { title: 'Completed', completed: true });

      const result = await service.listTodos(org.id, { filter: 'active' });

      expect(result.todos).toHaveLength(1);
      expect(result.todos[0]?.title).toBe('Active');
    });

    it('filters completed todos', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      await createTestTodo(org.id, user.id, { title: 'Active', completed: false });
      await createTestTodo(org.id, user.id, { title: 'Completed', completed: true });

      const result = await service.listTodos(org.id, { filter: 'completed' });

      expect(result.todos).toHaveLength(1);
      expect(result.todos[0]?.title).toBe('Completed');
    });

    it('does not return other organization todos', async () => {
      const user = await createTestUser();
      const org1 = await createTestOrg();
      const org2 = await createTestOrg();
      await createTestOrgMember(user.id, org1.id, 'MEMBER');
      await createTestOrgMember(user.id, org2.id, 'MEMBER');
      await createTestTodo(org1.id, user.id, { title: 'Org 1 Todo' });
      await createTestTodo(org2.id, user.id, { title: 'Org 2 Todo' });

      const result = await service.listTodos(org1.id);

      expect(result.todos).toHaveLength(1);
      expect(result.todos[0]?.title).toBe('Org 1 Todo');
    });
  });

  describe('createTodo', () => {
    it('creates todo with title', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();

      const result = await service.createTodo(org.id, user.id, { title: 'New Todo' });

      expect(result.title).toBe('New Todo');
      expect(result.completed).toBe(false);
      expect(result.organizationId).toBe(org.id);
      expect(result.createdBy).toBe(user.id);
    });

    it('creates todo with description', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();

      const result = await service.createTodo(org.id, user.id, {
        title: 'New Todo',
        description: 'Description here',
      });

      expect(result.description).toBe('Description here');
    });
  });

  describe('getTodo', () => {
    it('returns todo if found', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { title: 'My Todo' });

      const result = await service.getTodo(todo.id, org.id);

      expect(result.id).toBe(todo.id);
      expect(result.title).toBe('My Todo');
    });

    it('throws 404 if not found', async () => {
      const org = await createTestOrg();

      await expect(service.getTodo('nonexistent-id', org.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 404 for other organization todo', async () => {
      const user = await createTestUser();
      const org1 = await createTestOrg();
      const org2 = await createTestOrg();
      const todo = await createTestTodo(org1.id, user.id);

      await expect(service.getTodo(todo.id, org2.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('updateTodo', () => {
    it('updates todo title', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { title: 'Old Title' });

      const result = await service.updateTodo(todo.id, org.id, { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('updates todo completed status', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { completed: false });

      const result = await service.updateTodo(todo.id, org.id, { completed: true });

      expect(result.completed).toBe(true);
    });

    it('throws 404 for other organization todo', async () => {
      const user = await createTestUser();
      const org1 = await createTestOrg();
      const org2 = await createTestOrg();
      const todo = await createTestTodo(org1.id, user.id);

      await expect(
        service.updateTodo(todo.id, org2.id, { title: 'Hacked' }),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('deleteTodo', () => {
    it('deletes todo', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id);

      await service.deleteTodo(todo.id, org.id);

      const deleted = await db.todo.findUnique({ where: { id: todo.id } });
      expect(deleted).toBeNull();
    });

    it('throws 404 for other organization todo', async () => {
      const user = await createTestUser();
      const org1 = await createTestOrg();
      const org2 = await createTestOrg();
      const todo = await createTestTodo(org1.id, user.id);

      await expect(service.deleteTodo(todo.id, org2.id)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('toggleTodo', () => {
    it('toggles todo to completed', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { completed: false });

      const result = await service.toggleTodo(todo.id, org.id, true);

      expect(result.completed).toBe(true);
    });

    it('toggles todo to incomplete', async () => {
      const user = await createTestUser();
      const org = await createTestOrg();
      const todo = await createTestTodo(org.id, user.id, { completed: true });

      const result = await service.toggleTodo(todo.id, org.id, false);

      expect(result.completed).toBe(false);
    });
  });
});
