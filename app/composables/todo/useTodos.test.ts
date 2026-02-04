import type { Todo } from '#shared/todo';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, reactive, readonly, ref, watch } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);
vi.stubGlobal('readonly', readonly);
vi.stubGlobal('watch', watch);

// Mock state
const mockTodos = ref<Todo[]>([]);
const mockLoading = ref(false);
const mockTotal = ref(0);
const mockRouteQuery = reactive<Record<string, string | number>>({});
const mockRouteParams = reactive<Record<string, string>>({ slug: 'test-org' });
const mockRouterPush = vi.fn();
const mockToastAdd = vi.fn();

vi.stubGlobal('useState', vi.fn((key: string, init?: () => unknown) => {
  if (key === 'todos:list')
    return mockTodos;
  if (key === 'todos:loading')
    return mockLoading;
  if (key === 'todos:total')
    return mockTotal;
  return ref(init?.());
}));

vi.stubGlobal('useRoute', vi.fn(() => ({
  query: mockRouteQuery,
  params: mockRouteParams,
})));

vi.stubGlobal('useRouter', vi.fn(() => ({
  push: mockRouterPush,
})));

vi.stubGlobal('useToast', vi.fn(() => ({
  add: mockToastAdd,
})));

vi.stubGlobal('$fetch', vi.fn());

// Import after mocks
const { useTodos } = await import('./useTodos');

function createTodo(id: string, completed = false): Todo {
  return {
    id,
    title: `Todo ${id}`,
    description: null,
    completed,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId: 'org-1',
    createdBy: 'user-1',
  };
}

describe('useTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTodos.value = [];
    mockLoading.value = false;
    mockTotal.value = 0;
    Object.keys(mockRouteQuery).forEach(k => delete mockRouteQuery[k]);
    mockRouteParams.slug = 'test-org';
  });

  describe('totalPages', () => {
    it('calculates pages from total', () => {
      mockTotal.value = 25;
      const { totalPages } = useTodos();
      expect(totalPages.value).toBe(3); // 25 / 10 = 2.5 -> 3
    });

    it('returns 0 when no todos', () => {
      const { totalPages } = useTodos();
      expect(totalPages.value).toBe(0);
    });
  });

  describe('filter/sort from URL', () => {
    it('reads filter from query', () => {
      mockRouteQuery.filter = 'completed';
      const { filter } = useTodos();
      expect(filter.value).toBe('completed');
    });

    it('defaults filter to all', () => {
      const { filter } = useTodos();
      expect(filter.value).toBe('all');
    });

    it('reads sort from query', () => {
      mockRouteQuery.sort = 'title';
      const { sort } = useTodos();
      expect(sort.value).toBe('title');
    });

    it('defaults sort to date', () => {
      const { sort } = useTodos();
      expect(sort.value).toBe('date');
    });
  });

  describe('fetchTodos', () => {
    it('fetches with org slug and current filter/sort/page', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todos: [], total: 0 });

      const { fetchTodos } = useTodos();
      await fetchTodos();

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/organizations/test-org/todos', {
        query: { filter: 'all', sort: 'date', page: 1, limit: 10 },
      });
    });

    it('stores fetched todos and total', async () => {
      const todos = [createTodo('1')];
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todos, total: 15 });

      const { fetchTodos } = useTodos();
      await fetchTodos();

      expect(mockTodos.value).toEqual(todos);
      expect(mockTotal.value).toBe(15);
    });

    it('shows toast on error', async () => {
      vi.mocked(globalThis.$fetch).mockRejectedValue(new Error('fail'));

      const { fetchTodos } = useTodos();
      await fetchTodos();

      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          color: 'error',
        }),
      );
    });

    it('sets loading flag', async () => {
      vi.mocked(globalThis.$fetch).mockImplementation(async () => {
        expect(mockLoading.value).toBe(true);
        return Promise.resolve({ todos: [], total: 0 });
      });

      const { fetchTodos } = useTodos();
      await fetchTodos();

      expect(mockLoading.value).toBe(false);
    });
  });

  describe('setFilter', () => {
    it('updates filter and resets page', () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todos: [], total: 0 });

      const { setFilter, filter, page } = useTodos();
      setFilter('completed');

      expect(filter.value).toBe('completed');
      expect(page.value).toBe(1);
    });

    it('updates URL with filter', () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todos: [], total: 0 });

      const { setFilter } = useTodos();
      setFilter('active');

      expect(mockRouterPush).toHaveBeenCalledWith({
        query: { filter: 'active' },
      });
    });
  });

  describe('setSort', () => {
    it('updates sort and resets page', () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todos: [], total: 0 });

      const { setSort, sort, page } = useTodos();
      setSort('title');

      expect(sort.value).toBe('title');
      expect(page.value).toBe(1);
    });
  });

  describe('setPage', () => {
    it('does nothing for invalid page', () => {
      mockTotal.value = 10; // 1 page
      const { setPage } = useTodos();

      setPage(0);
      expect(mockRouterPush).not.toHaveBeenCalled();

      setPage(5);
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it('updates page for valid value', () => {
      mockTotal.value = 50; // 5 pages
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todos: [], total: 50 });

      const { setPage, page } = useTodos();
      setPage(3);

      expect(page.value).toBe(3);
      expect(mockRouterPush).toHaveBeenCalledWith({ query: { page: 3 } });
    });
  });

  describe('createTodo', () => {
    it('adds todo to front of list', async () => {
      mockTodos.value = [createTodo('existing')];
      const newTodo = createTodo('new');
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todo: newTodo });

      const { createTodo: create } = useTodos();
      await create({ title: 'New Todo' });

      expect(mockTodos.value[0]?.id).toBe('new');
      expect(mockTodos.value).toHaveLength(2);
    });

    it('calls API with org slug', async () => {
      vi.mocked(globalThis.$fetch).mockResolvedValue({ todo: createTodo('1') });

      const { createTodo: create } = useTodos();
      await create({ title: 'Test' });

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/organizations/test-org/todos', {
        method: 'POST',
        body: { title: 'Test' },
      });
    });

    it('shows toast and throws on error', async () => {
      vi.mocked(globalThis.$fetch).mockRejectedValue(new Error('fail'));

      const { createTodo: create } = useTodos();

      await expect(create({ title: 'Test' })).rejects.toThrow('Failed to create todo');
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'error' }),
      );
    });
  });

  describe('toggleTodo', () => {
    it('optimistically updates then calls API with org slug', async () => {
      const todo = createTodo('1', false);
      mockTodos.value = [todo];
      vi.mocked(globalThis.$fetch).mockResolvedValue({});

      const { toggleTodo } = useTodos();
      await toggleTodo('1', true);

      expect(mockTodos.value[0]?.completed).toBe(true);
      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/organizations/test-org/todos/1/toggle', {
        method: 'POST',
        body: { completed: true },
      });
    });

    it('reverts on error', async () => {
      const todo = createTodo('1', false);
      mockTodos.value = [todo];
      vi.mocked(globalThis.$fetch).mockRejectedValue(new Error('fail'));

      const { toggleTodo } = useTodos();
      await toggleTodo('1', true);

      expect(mockTodos.value[0]?.completed).toBe(false); // reverted
      expect(mockToastAdd).toHaveBeenCalled();
    });
  });

  describe('deleteTodo', () => {
    it('optimistically removes then calls API with org slug', async () => {
      mockTodos.value = [createTodo('1'), createTodo('2')];
      vi.mocked(globalThis.$fetch).mockResolvedValue({});

      const { deleteTodo } = useTodos();
      await deleteTodo('1');

      expect(mockTodos.value).toHaveLength(1);
      expect(mockTodos.value[0]?.id).toBe('2');
      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/organizations/test-org/todos/1', {
        method: 'DELETE',
      });
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      );
    });

    it('restores on error', async () => {
      mockTodos.value = [createTodo('1'), createTodo('2')];
      vi.mocked(globalThis.$fetch).mockRejectedValue(new Error('fail'));

      const { deleteTodo } = useTodos();
      await deleteTodo('1');

      expect(mockTodos.value).toHaveLength(2);
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'error' }),
      );
    });
  });
});
