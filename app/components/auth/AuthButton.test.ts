import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';
import { getUserInitials } from '../../utils/user';
import AuthButton from './AuthButton.vue';

// Stub Nuxt UI components
const stubs = {
  UButton: {
    template: '<a :href="to"><slot />{{ label }}</a>',
    props: ['to', 'label', 'color', 'variant', 'trailingIcon', 'class'],
  },
  UDropdownMenu: {
    template: '<div class="dropdown" data-testid="dropdown"><slot /></div>',
    props: ['items', 'ui'],
  },
  UAvatar: {
    template: '<div class="avatar" :data-alt="alt" :data-src="src">{{ text }}</div>',
    props: ['alt', 'src', 'text', 'size', 'role', 'ariaLabel', 'class'],
  },
};

// Mock state
let mockSession: { id: string } | null = null;
let mockUser: { id: string; name: string; email: string; image: string | null } | null = null;
let mockIsPending = false;
let mockIsSuperAdmin = false;

vi.stubGlobal('useAuth', () => ({
  session: computed(() => mockSession),
  user: computed(() => mockUser),
  isPending: computed(() => mockIsPending),
  signOut: vi.fn(),
}));

vi.stubGlobal('useRole', () => ({
  isSuperAdmin: computed(() => mockIsSuperAdmin),
}));

vi.stubGlobal('computed', computed);

describe('authButton', () => {
  beforeEach(() => {
    mockSession = null;
    mockUser = null;
    mockIsPending = false;
    mockIsSuperAdmin = false;
  });

  const mountWithGlobals = () => mount(AuthButton, {
    global: {
      stubs,
      mocks: {
        getUserInitials,
      },
    },
  });

  it('shows nothing while pending', () => {
    mockIsPending = true;
    const wrapper = mountWithGlobals();
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dropdown"]').exists()).toBe(false);
  });

  it('shows login button when not authenticated', () => {
    const wrapper = mountWithGlobals();
    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain('Login');
    expect(link.attributes('href')).toBe('/auth/login');
  });

  it('shows dropdown when authenticated', () => {
    mockSession = { id: 'session-1' };
    mockUser = { id: 'user-1', name: 'John', email: 'john@example.com', image: null };
    const wrapper = mountWithGlobals();
    expect(wrapper.find('[data-testid="dropdown"]').exists()).toBe(true);
    expect(wrapper.find('.avatar').exists()).toBe(true);
  });

  it('shows avatar with user name as alt', () => {
    mockSession = { id: 'session-1' };
    mockUser = { id: 'user-1', name: 'John Doe', email: 'john@example.com', image: null };
    const wrapper = mountWithGlobals();
    const avatar = wrapper.find('.avatar');
    expect(avatar.attributes('data-alt')).toBe('John Doe');
  });

  it('shows avatar with user image when available', () => {
    mockSession = { id: 'session-1' };
    mockUser = {
      id: 'user-1',
      name: 'John',
      email: 'john@example.com',
      image: 'https://example.com/avatar.jpg',
    };
    const wrapper = mountWithGlobals();
    const avatar = wrapper.find('.avatar');
    expect(avatar.attributes('data-src')).toBe('https://example.com/avatar.jpg');
  });

  it('shows user initials in avatar', () => {
    mockSession = { id: 'session-1' };
    mockUser = { id: 'user-1', name: 'John Doe', email: 'john@example.com', image: null };
    const wrapper = mountWithGlobals();
    const avatar = wrapper.find('.avatar');
    expect(avatar.text()).toBe('JD');
  });

  it('falls back to email for alt when no name', () => {
    mockSession = { id: 'session-1' };
    mockUser = { id: 'user-1', name: '', email: 'john@example.com', image: null };
    const wrapper = mountWithGlobals();
    const avatar = wrapper.find('.avatar');
    expect(avatar.attributes('data-alt')).toBe('john@example.com');
  });
});
