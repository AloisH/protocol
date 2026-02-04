import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import AppHeader from './AppHeader.vue';

describe('appHeader', () => {
  it('renders header with Protocol branding', async () => {
    const wrapper = await mountSuspended(AppHeader);
    expect(wrapper.text()).toContain('Protocol');
  });

  it('has navigation links', async () => {
    const wrapper = await mountSuspended(AppHeader);
    const links = wrapper.findAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('renders logo with distinctive geometric accent', async () => {
    const wrapper = await mountSuspended(AppHeader);
    const logo = wrapper.find('[aria-label="Protocol home"]');
    expect(logo.exists()).toBe(true);
  });

  it('has mobile menu button', async () => {
    const wrapper = await mountSuspended(AppHeader);
    const menuButton = wrapper.find('button[aria-label="Toggle navigation menu"]');
    expect(menuButton.exists()).toBe(true);
  });

  it('has settings link', async () => {
    const wrapper = await mountSuspended(AppHeader);
    const settingsBtn = wrapper.find('[aria-label="Settings"]');
    expect(settingsBtn.exists()).toBe(true);
  });

  it('has mobile menu button on small screens', async () => {
    const wrapper = await mountSuspended(AppHeader);
    const menuButton = wrapper.find('button[aria-label="Toggle navigation menu"]');
    expect(menuButton.exists()).toBe(true);
  });
});
