import { render } from '@vue-email/render';
import { describe, expect, it } from 'vitest';
import AccountDeletion from './AccountDeletion.vue';

describe('accountDeletion template', () => {
  it('renders html with name', async () => {
    const html = await render(AccountDeletion, {
      name: 'Test User',
    });

    expect(html).toMatchSnapshot();
  });

  it('renders html without name (generic greeting)', async () => {
    const html = await render(AccountDeletion, {});

    expect(html).toMatchSnapshot();
  });

  it('renders plain text', async () => {
    const text = await render(AccountDeletion, { name: 'Test User' }, { plainText: true });

    expect(text).toMatchSnapshot();
  });
});
