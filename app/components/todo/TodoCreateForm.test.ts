import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';
import TodoCreateForm from './TodoCreateForm.vue';

// Mock createTodo
const mockCreateTodo = vi.fn();

vi.stubGlobal('useTodos', () => ({
  createTodo: mockCreateTodo,
}));
vi.stubGlobal('ref', ref);
vi.stubGlobal('reactive', reactive);

// Stub Nuxt UI components - simpler stubs that don't try to handle events
const stubs = {
  UForm: {
    template: '<div class="u-form"><slot /></div>',
    props: ['state', 'schema'],
  },
  UFormField: {
    template: '<div class="form-field"><label>{{ label }}</label><slot /></div>',
    props: ['name', 'label', 'required'],
  },
  UInput: {
    template: '<input class="u-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue'],
  },
  UTextarea: {
    template: '<textarea class="u-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'rows'],
    emits: ['update:modelValue'],
  },
  UAlert: {
    template: '<div class="u-alert" :data-color="color">{{ title }}</div>',
    props: ['color', 'variant', 'title', 'class'],
  },
  UButton: {
    template: '<button class="u-button" :type="type" :disabled="loading"><slot /></button>',
    props: ['type', 'icon', 'loading', 'block'],
  },
};

describe('todoCreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTodo.mockReset();
  });

  it('renders form with title and description fields', () => {
    const wrapper = mount(TodoCreateForm, { global: { stubs } });

    expect(wrapper.find('.u-form').exists()).toBe(true);
    expect(wrapper.find('.u-input').exists()).toBe(true);
    expect(wrapper.find('.u-textarea').exists()).toBe(true);
  });

  it('renders submit button with Add Todo text', () => {
    const wrapper = mount(TodoCreateForm, { global: { stubs } });

    const button = wrapper.find('button[type="submit"]');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Add Todo');
  });

  it('has title and description form fields', () => {
    const wrapper = mount(TodoCreateForm, { global: { stubs } });

    const fields = wrapper.findAll('.form-field');
    expect(fields).toHaveLength(2);
    expect(fields[0]?.text()).toContain('Title');
    expect(fields[1]?.text()).toContain('Description');
  });

  it('allows input in title field', async () => {
    const wrapper = mount(TodoCreateForm, { global: { stubs } });

    const input = wrapper.find('.u-input');
    await input.setValue('New task');

    expect((input.element as HTMLInputElement).value).toBe('New task');
  });

  it('allows input in description field', async () => {
    const wrapper = mount(TodoCreateForm, { global: { stubs } });

    const textarea = wrapper.find('.u-textarea');
    await textarea.setValue('Task description');

    expect((textarea.element as HTMLTextAreaElement).value).toBe('Task description');
  });

  it('has aria-label for accessibility', () => {
    const wrapper = mount(TodoCreateForm, { global: { stubs } });

    // The UForm has aria-label attribute
    expect(wrapper.find('[aria-label="Create new todo"]').exists()).toBe(true);
  });
});
