import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import OrganizationSwitcher from './OrganizationSwitcher.vue';

// Mock state
const mockOrganizations = ref<{ id: string; name: string; slug: string }[]>([]);
const mockActiveOrganization = ref<{ id: string; name: string; slug: string } | null>(null);
const mockActiveOrgSlug = ref('');
const mockFetchOrganizations = vi.fn();

vi.stubGlobal('useOrganization', () => ({
  organizations: mockOrganizations,
  activeOrganization: computed(() => mockActiveOrganization.value),
  activeOrgSlug: computed(() => mockActiveOrgSlug.value),
  fetchOrganizations: mockFetchOrganizations,
}));

vi.stubGlobal('computed', computed);
vi.stubGlobal('onMounted', vi.fn((cb: () => void) => {
  cb();
}));

// Stub components
const stubs = {
  ClientOnly: { template: '<div><slot /></div>' },
  UDropdownMenu: {
    template: '<div class="dropdown"><slot /></div>',
    props: ['items', 'ui'],
  },
  UButton: {
    template: '<button :to="to" :aria-label="ariaLabel"><slot /></button>',
    props: ['color', 'variant', 'trailingIcon', 'block', 'to', 'ariaLabel'],
  },
  UAvatar: {
    template: '<div class="avatar">{{ text }}</div>',
    props: ['text', 'size'],
  },
  UIcon: {
    template: '<span class="icon" :name="name" />',
    props: ['name'],
  },
};

describe('organizationSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizations.value = [];
    mockActiveOrganization.value = null;
    mockActiveOrgSlug.value = '';
  });

  it('fetches organizations on mount', () => {
    mount(OrganizationSwitcher, {
      global: { stubs },
    });

    expect(mockFetchOrganizations).toHaveBeenCalled();
  });

  it('shows create org button when no active organization', () => {
    const wrapper = mount(OrganizationSwitcher, {
      global: { stubs },
    });

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('to')).toBe('/org/create');
    expect(button.text()).toContain('Create Organization');
  });

  it('shows dropdown when active organization exists', () => {
    mockActiveOrganization.value = { id: 'org-1', name: 'My Org', slug: 'my-org' };
    mockActiveOrgSlug.value = 'my-org';

    const wrapper = mount(OrganizationSwitcher, {
      global: { stubs },
    });

    expect(wrapper.find('.dropdown').exists()).toBe(true);
  });

  it('displays active organization name', () => {
    mockActiveOrganization.value = { id: 'org-1', name: 'Acme Corp', slug: 'acme' };
    mockActiveOrgSlug.value = 'acme';

    const wrapper = mount(OrganizationSwitcher, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain('Acme Corp');
  });

  it('shows avatar with first letter of org name', () => {
    mockActiveOrganization.value = { id: 'org-1', name: 'Acme Corp', slug: 'acme' };
    mockActiveOrgSlug.value = 'acme';

    const wrapper = mount(OrganizationSwitcher, {
      global: { stubs },
    });

    const avatar = wrapper.find('.avatar');
    expect(avatar.text()).toBe('A');
  });

  it('has correct aria-label for accessibility', () => {
    mockActiveOrganization.value = { id: 'org-1', name: 'Acme Corp', slug: 'acme' };
    mockActiveOrgSlug.value = 'acme';

    const wrapper = mount(OrganizationSwitcher, {
      global: { stubs },
    });

    const button = wrapper.find('button');
    expect(button.attributes('aria-label')).toBe('Switch organization, current: Acme Corp');
  });
});
