import { render } from '@vue-email/render';
import { describe, expect, it } from 'vitest';
import ResetPasswordEmail from './ResetPasswordEmail.vue';

describe('resetPasswordEmail template', () => {
  it('renders html with all props', async () => {
    const html = await render(ResetPasswordEmail, {
      name: 'Test User',
      resetLink: 'https://example.com/reset?token=abc123',
      email: 'test@example.com',
    });

    expect(html).toMatchSnapshot();
  });

  it('renders html without optional email', async () => {
    const html = await render(ResetPasswordEmail, {
      name: 'Test User',
      resetLink: 'https://example.com/reset',
    });

    expect(html).toMatchSnapshot();
  });

  it('renders plain text', async () => {
    const text = await render(
      ResetPasswordEmail,
      { name: 'Test User', resetLink: 'https://example.com' },
      { plainText: true },
    );

    expect(text).toMatchSnapshot();
  });
});
