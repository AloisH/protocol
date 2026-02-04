import { describe, expect, it } from 'vitest';
import { createTodoSchema, todoQuerySchema, toggleTodoSchema, updateTodoSchema } from './schemas';

describe('todo Schemas', () => {
  describe('createTodoSchema', () => {
    it('accepts valid todo', () => {
      const result = createTodoSchema.parse({ title: 'My Task' });
      expect(result.title).toBe('My Task');
    });

    it('accepts todo with description', () => {
      const result = createTodoSchema.parse({
        title: 'Task',
        description: 'Details here',
      });
      expect(result.description).toBe('Details here');
    });

    it('rejects empty title', () => {
      expect(() => createTodoSchema.parse({ title: '' })).toThrow();
    });

    it('rejects title over 200 chars', () => {
      expect(() => createTodoSchema.parse({ title: 'a'.repeat(201) })).toThrow();
    });

    it('rejects description over 1000 chars', () => {
      expect(() =>
        createTodoSchema.parse({
          title: 'Task',
          description: 'a'.repeat(1001),
        }),
      ).toThrow();
    });

    it('accepts title at max length', () => {
      const result = createTodoSchema.parse({ title: 'a'.repeat(200) });
      expect(result.title).toHaveLength(200);
    });

    it('accepts description at max length', () => {
      const result = createTodoSchema.parse({
        title: 'Task',
        description: 'a'.repeat(1000),
      });
      expect(result.description).toHaveLength(1000);
    });
  });

  describe('updateTodoSchema', () => {
    it('accepts partial update with title only', () => {
      const result = updateTodoSchema.parse({ title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('accepts partial update with description only', () => {
      const result = updateTodoSchema.parse({ description: 'New desc' });
      expect(result.description).toBe('New desc');
    });

    it('accepts partial update with completed only', () => {
      const result = updateTodoSchema.parse({ completed: true });
      expect(result.completed).toBe(true);
    });

    it('accepts full update', () => {
      const result = updateTodoSchema.parse({
        title: 'New Title',
        description: 'New Desc',
        completed: true,
      });
      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New Desc');
      expect(result.completed).toBe(true);
    });

    it('accepts empty object', () => {
      const result = updateTodoSchema.parse({});
      expect(result).toEqual({});
    });

    it('rejects invalid title', () => {
      expect(() => updateTodoSchema.parse({ title: '' })).toThrow();
    });
  });

  describe('toggleTodoSchema', () => {
    it('accepts completed true', () => {
      const result = toggleTodoSchema.parse({ completed: true });
      expect(result.completed).toBe(true);
    });

    it('accepts completed false', () => {
      const result = toggleTodoSchema.parse({ completed: false });
      expect(result.completed).toBe(false);
    });

    it('rejects missing completed', () => {
      expect(() => toggleTodoSchema.parse({})).toThrow();
    });

    it('rejects non-boolean', () => {
      expect(() => toggleTodoSchema.parse({ completed: 'yes' })).toThrow();
    });
  });

  describe('todoQuerySchema', () => {
    it('provides defaults for empty query', () => {
      const result = todoQuerySchema.parse({});
      expect(result.filter).toBe('all');
      expect(result.sort).toBe('date');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('accepts all filter values', () => {
      for (const filter of ['all', 'active', 'completed']) {
        const result = todoQuerySchema.parse({ filter });
        expect(result.filter).toBe(filter);
      }
    });

    it('accepts all sort values', () => {
      for (const sort of ['date', 'title']) {
        const result = todoQuerySchema.parse({ sort });
        expect(result.sort).toBe(sort);
      }
    });

    it('coerces page to number', () => {
      const result = todoQuerySchema.parse({ page: '5' });
      expect(result.page).toBe(5);
    });

    it('coerces limit to number', () => {
      const result = todoQuerySchema.parse({ limit: '25' });
      expect(result.limit).toBe(25);
    });

    it('rejects invalid filter', () => {
      expect(() => todoQuerySchema.parse({ filter: 'invalid' })).toThrow();
    });

    it('rejects invalid sort', () => {
      expect(() => todoQuerySchema.parse({ sort: 'invalid' })).toThrow();
    });

    it('rejects page less than 1', () => {
      expect(() => todoQuerySchema.parse({ page: 0 })).toThrow();
    });

    it('rejects limit less than 1', () => {
      expect(() => todoQuerySchema.parse({ limit: 0 })).toThrow();
    });

    it('rejects limit over 100', () => {
      expect(() => todoQuerySchema.parse({ limit: 101 })).toThrow();
    });
  });
});
