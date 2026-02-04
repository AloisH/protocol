import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import AppErrorBoundary from './AppErrorBoundary.vue';

// Mock Nuxt auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('onErrorCaptured', vi.fn());

describe('appErrorBoundary', () => {
  it('renders slot content', () => {
    const wrapper = mount(AppErrorBoundary, {
      slots: {
        default: '<div data-testid="content">Hello</div>',
      },
      global: {
        stubs: {
          UIcon: true,
          UButton: defineComponent({
            setup(_, { slots }) {
              return () => h('button', slots.default?.());
            },
          }),
        },
      },
    });

    expect(wrapper.find('[data-testid="content"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Hello');
  });
});
