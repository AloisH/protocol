import { render } from '@vue-email/render';
import { describe, expect, it } from 'vitest';
import VerifyEmail from './VerifyEmail.vue';

describe('verifyEmail template', () => {
  it('renders html with all props', async () => {
    const html = await render(VerifyEmail, {
      name: 'Test User',
      verificationLink: 'https://example.com/verify?token=abc123',
      email: 'test@example.com',
    });

    expect(html).toMatchSnapshot();
  });

  it('renders html without optional email', async () => {
    const html = await render(VerifyEmail, {
      name: 'Test User',
      verificationLink: 'https://example.com/verify',
    });

    expect(html).toMatchSnapshot();
  });

  it('renders plain text', async () => {
    const text = await render(
      VerifyEmail,
      { name: 'Test User', verificationLink: 'https://example.com' },
      { plainText: true },
    );

    expect(text).toMatchSnapshot();
  });
});
