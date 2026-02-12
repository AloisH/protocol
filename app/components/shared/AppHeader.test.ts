import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import AppHeader from './AppHeader.vue';

// Stub NuxtLink and Nuxt UI components
const stubs = {
  NuxtLink: defineComponent({
    props: ['to'],
    setup(props, { slots }) {
      return () => h('a', { href: props.to }, slots.default?.());
    },
  }),
  UButton: defineComponent({
    props: ['icon', 'variant', 'color', 'size', 'to', 'ariaLabel'],
    attrs: {},
    setup(props, { attrs, slots }) {
      return () => h('button', { 'aria-label': attrs['aria-label'] ?? props.ariaLabel }, slots.default?.());
    },
  }),
  UColorModeButton: defineComponent({
    setup() {
      return () => h('button', { 'aria-label': 'Toggle color mode' });
    },
  }),
  UIcon: defineComponent({
    props: ['name'],
    setup(props) {
      return () => h('span', { class: props.name });
    },
  }),
  BrandedLogo: defineComponent({
    setup() {
      return () => h('a', { 'aria-label': 'Protocol home', 'href': '/' }, 'Protocol');
    },
  }),
};

// Mock useRoute
vi.stubGlobal('useRoute', () => ({ path: '/' }));

function mountHeader() {
  return mount(AppHeader, {
    global: {
      stubs,
    },
  });
}

describe('appHeader', () => {
  it('renders header with Protocol branding', () => {
    const wrapper = mountHeader();
    expect(wrapper.text()).toContain('Protocol');
  });

  it('has navigation links', () => {
    const wrapper = mountHeader();
    const links = wrapper.findAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders logo with distinctive geometric accent', () => {
    const wrapper = mountHeader();
    const logo = wrapper.find('[aria-label="Protocol home"]');
    expect(logo.exists()).toBe(true);
  });

  it('has mobile menu button', () => {
    const wrapper = mountHeader();
    const menuButton = wrapper.find('button[aria-label="Toggle navigation menu"]');
    expect(menuButton.exists()).toBe(true);
  });

  it('has settings link', () => {
    const wrapper = mountHeader();
    const settingsBtn = wrapper.find('[aria-label="Settings"]');
    expect(settingsBtn.exists()).toBe(true);
  });
});
