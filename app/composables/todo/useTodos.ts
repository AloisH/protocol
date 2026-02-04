import type { CreateTodoInput, Todo, TodoListResponse, TodoResponse } from '#shared/todo';

export function useTodos() {
  const route = useRoute();
  const router = useRouter();
  const todos = useState<Todo[]>('todos:list', () => []);
  const loading = useState('todos:loading', () => false);
  const toast = useToast();

  const orgSlug = computed(() => route.params.slug as string);

  // Pagination state
  const page = ref(Number(route.query.page) || 1);
  const limit = ref(10);
  const total = useState('todos:total', () => 0);
  const totalPages = computed(() => Math.ceil(total.value / limit.value));

  // URL-synced filter and sort state
  const filter = ref<'all' | 'active' | 'completed'>(
    (route.query.filter as 'all' | 'active' | 'completed' | undefined) ?? 'all',
  );
  const sort = ref<'date' | 'title'>((route.query.sort as 'date' | 'title' | undefined) ?? 'date');

  async function fetchTodos() {
    loading.value = true;
    try {
      const data = await $fetch<TodoListResponse>(`/api/organizations/${orgSlug.value}/todos`, {
        query: { filter: filter.value, sort: sort.value, page: page.value, limit: limit.value },
      });
      todos.value = data.todos;
      total.value = data.total;
    }
    catch {
      toast.add({
        title: 'Error',
        description: 'Failed to load todos',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
    }
    finally {
      loading.value = false;
    }
  }

  function updateUrl() {
    const query: Record<string, string | number> = {};
    if (filter.value !== 'all')
      query.filter = filter.value;
    if (sort.value !== 'date')
      query.sort = sort.value;
    if (page.value > 1)
      query.page = page.value;
    void router.push({ query });
  }

  function setFilter(newFilter: 'all' | 'active' | 'completed') {
    filter.value = newFilter;
    page.value = 1; // Reset to first page
    updateUrl();
    void fetchTodos();
  }

  function setSort(newSort: 'date' | 'title') {
    sort.value = newSort;
    page.value = 1; // Reset to first page
    updateUrl();
    void fetchTodos();
  }

  function setPage(newPage: number) {
    if (newPage < 1 || newPage > totalPages.value)
      return;
    page.value = newPage;
    updateUrl();
    void fetchTodos();
  }

  // Watch route changes (back/forward navigation)
  watch(
    () => route.query,
    (newQuery) => {
      filter.value = (newQuery.filter as 'all' | 'active' | 'completed' | undefined) ?? 'all';
      sort.value = (newQuery.sort as 'date' | 'title' | undefined) ?? 'date';
      page.value = Number(newQuery.page) || 1;
      void fetchTodos();
    },
  );

  async function createTodo(input: CreateTodoInput) {
    try {
      const { todo } = await $fetch<TodoResponse>(`/api/organizations/${orgSlug.value}/todos`, {
        method: 'POST',
        body: input,
      });
      todos.value.unshift(todo);
    }
    catch {
      toast.add({
        title: 'Error',
        description: 'Failed to create todo',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
      throw new Error('Failed to create todo');
    }
  }

  async function toggleTodo(id: string, completed: boolean) {
    const todo = todos.value.find(t => t.id === id);
    if (todo)
      todo.completed = completed;

    try {
      await $fetch(`/api/organizations/${orgSlug.value}/todos/${id}/toggle`, {
        method: 'POST',
        body: { completed },
      });
    }
    catch {
      if (todo)
        todo.completed = !completed;
      toast.add({
        title: 'Error',
        description: 'Failed to update todo',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
    }
  }

  async function deleteTodo(id: string) {
    const index = todos.value.findIndex(t => t.id === id);
    const removed = todos.value.splice(index, 1);

    try {
      await $fetch(`/api/organizations/${orgSlug.value}/todos/${id}`, { method: 'DELETE' });
      toast.add({
        title: 'Success',
        description: 'Todo deleted',
        color: 'success',
        icon: 'i-lucide-check',
      });
    }
    catch {
      todos.value.splice(index, 0, ...removed);
      toast.add({
        title: 'Error',
        description: 'Failed to delete todo',
        color: 'error',
        icon: 'i-lucide-alert-triangle',
      });
    }
  }

  return {
    todos: readonly(todos),
    loading: readonly(loading),
    filter: readonly(filter),
    sort: readonly(sort),
    // Pagination
    page: readonly(page),
    total: readonly(total),
    totalPages,
    setPage,
    // Actions
    fetchTodos,
    setFilter,
    setSort,
    createTodo,
    toggleTodo,
    deleteTodo,
  };
}
