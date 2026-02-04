import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import TodoList from './TodoList.vue';

// Mock state
const mockTodos = ref<{ id: string; title: string; description?: string; completed: boolean; createdAt: Date }[]>([]);
const mockLoading = ref(false);
const mockFilter = ref<'all' | 'active' | 'completed'>('all');
const mockSort = ref<'date' | 'title'>('date');
const mockPage = ref(1);
const mockTotal = ref(0);
const mockTotalPages = ref(0);
const mockSetFilter = vi.fn();
const mockSetSort = vi.fn();
const mockSetPage = vi.fn();
const mockToggleTodo = vi.fn();
const mockDeleteTodo = vi.fn();

vi.stubGlobal('useTodos', () => ({
  todos: mockTodos,
  loading: mockLoading,
  filter: mockFilter,
  sort: mockSort,
  page: mockPage,
  total: mockTotal,
  totalPages: computed(() => mockTotalPages.value),
  setFilter: mockSetFilter,
  setSort: mockSetSort,
  setPage: mockSetPage,
  toggleTodo: mockToggleTodo,
  deleteTodo: mockDeleteTodo,
}));

vi.stubGlobal('computed', computed);

// Mock useRoute for org slug
vi.stubGlobal('useRoute', () => ({
  params: { slug: 'test-org' },
  query: {},
}));

// Stub components
const stubs = {
  TodoCreateForm: { template: '<div class="todo-create-form" />' },
  UIcon: { template: '<span class="icon" :name="name" />', props: ['name'] },
  UBadge: {
    template: '<span class="badge" :class="color" @click="$emit(\'click\')"><slot /></span>',
    props: ['variant', 'color'],
  },
  USkeleton: { template: '<div class="skeleton" />', props: ['class'] },
  UEmpty: {
    template: '<div class="empty"><slot />{{ title }} - {{ description }}</div>',
    props: ['icon', 'title', 'description'],
  },
  UCheckbox: {
    template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
  },
  UButton: {
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'color', 'variant', 'size', 'disabled', 'ariaLabel'],
    emits: ['click'],
  },
};

describe('todoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTodos.value = [];
    mockLoading.value = false;
    mockFilter.value = 'all';
    mockSort.value = 'date';
    mockPage.value = 1;
    mockTotal.value = 0;
    mockTotalPages.value = 0;
  });

  it('renders create form', () => {
    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    expect(wrapper.find('.todo-create-form').exists()).toBe(true);
  });

  it('shows loading skeletons when loading', () => {
    mockLoading.value = true;

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    expect(wrapper.findAll('.skeleton').length).toBeGreaterThan(0);
  });

  it('shows empty state when no todos', () => {
    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const empty = wrapper.find('.empty');
    expect(empty.exists()).toBe(true);
    expect(empty.text()).toContain('No todos yet');
  });

  it('renders filter badges', () => {
    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const badges = wrapper.findAll('.badge');
    const badgeTexts = badges.map(b => b.text());
    expect(badgeTexts).toContain('All');
    expect(badgeTexts).toContain('Active');
    expect(badgeTexts).toContain('Completed');
  });

  it('highlights active filter', () => {
    mockFilter.value = 'active';

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const activeBadge = wrapper.findAll('.badge').find(b => b.text() === 'Active');
    expect(activeBadge?.classes()).toContain('primary');
  });

  it('calls setFilter when filter badge clicked', async () => {
    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const completedBadge = wrapper.findAll('.badge').find(b => b.text() === 'Completed');
    await completedBadge?.trigger('click');

    expect(mockSetFilter).toHaveBeenCalledWith('completed');
  });

  it('renders sort badges', () => {
    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const badges = wrapper.findAll('.badge');
    const badgeTexts = badges.map(b => b.text());
    expect(badgeTexts).toContain('Date');
    expect(badgeTexts).toContain('Title');
  });

  it('calls setSort when sort badge clicked', async () => {
    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const titleBadge = wrapper.findAll('.badge').find(b => b.text() === 'Title');
    await titleBadge?.trigger('click');

    expect(mockSetSort).toHaveBeenCalledWith('title');
  });

  it('renders todo items', () => {
    mockTodos.value = [
      { id: '1', title: 'Task 1', completed: false, createdAt: new Date() },
      { id: '2', title: 'Task 2', completed: true, createdAt: new Date() },
    ];

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Task 1');
    expect(wrapper.text()).toContain('Task 2');
  });

  it('renders checkboxes for todos', () => {
    mockTodos.value = [
      { id: '1', title: 'Task 1', completed: false, createdAt: new Date() },
    ];

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    expect(checkbox.exists()).toBe(true);
  });

  it('calls toggleTodo when checkbox changed', async () => {
    mockTodos.value = [
      { id: '1', title: 'Task 1', completed: false, createdAt: new Date() },
    ];

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const checkbox = wrapper.find('input[type="checkbox"]');
    await checkbox.setValue(true);

    expect(mockToggleTodo).toHaveBeenCalledWith('1', true);
  });

  it('calls deleteTodo when delete button clicked', async () => {
    mockTodos.value = [
      { id: '1', title: 'Task 1', completed: false, createdAt: new Date() },
    ];

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    // Find delete button (last button in todo item)
    const buttons = wrapper.findAll('button');
    const deleteBtn = buttons[buttons.length - 1]!;
    await deleteBtn.trigger('click');

    expect(mockDeleteTodo).toHaveBeenCalledWith('1');
  });

  it('shows pagination when multiple pages', () => {
    mockTodos.value = [{ id: '1', title: 'Task', completed: false, createdAt: new Date() }];
    mockTotalPages.value = 3;
    mockTotal.value = 25;
    mockPage.value = 2;

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('25 total');
    expect(wrapper.text()).toContain('2 / 3');
  });

  it('calls setPage when pagination buttons clicked', async () => {
    mockTodos.value = [{ id: '1', title: 'Task', completed: false, createdAt: new Date() }];
    mockTotalPages.value = 3;
    mockPage.value = 2;

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    // Find pagination buttons (after todo items)
    const buttons = wrapper.findAll('button');
    // Previous button
    await buttons[buttons.length - 2]!.trigger('click');
    expect(mockSetPage).toHaveBeenCalledWith(1);
  });

  it('disables previous button on first page', () => {
    mockTodos.value = [{ id: '1', title: 'Task', completed: false, createdAt: new Date() }];
    mockTotalPages.value = 3;
    mockPage.value = 1;

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const buttons = wrapper.findAll('button');
    const prevBtn = buttons[buttons.length - 2]!;
    expect(prevBtn.attributes('disabled')).toBeDefined();
  });

  it('applies strikethrough style to completed todos', () => {
    mockTodos.value = [
      { id: '1', title: 'Completed Task', completed: true, createdAt: new Date() },
    ];

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    const todoTitle = wrapper.find('.line-through');
    expect(todoTitle.exists()).toBe(true);
  });

  it('shows description when present', () => {
    mockTodos.value = [
      { id: '1', title: 'Task', description: 'Task description', completed: false, createdAt: new Date() },
    ];

    const wrapper = mount(TodoList, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Task description');
  });
});
