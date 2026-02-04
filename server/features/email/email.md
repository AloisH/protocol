# Email Feature

Email sending via Resend with Vue Email templates.

## Files

- `email-service.ts` - Email operations
- `email-client.ts` - Resend singleton
- `templates/` - Vue Email templates

## Templates

- `VerifyEmail.vue` - Email verification link
- `ResetPasswordEmail.vue` - Password reset link
- `AccountDeletion.vue` - Deletion confirmation

## Dependencies

- None (standalone feature)

## Usage

```typescript
import { emailService } from '~/server/features/email/email-service';

await emailService.sendEmailVerification({
  to: user.email,
  name: user.name,
  verificationLink: url,
});
```

## Configuration

- Requires `NUXT_RESEND_API_KEY` env var
- Graceful degradation if not configured
- Test mode: Use `re_test_*` keys

See: Vue Email docs for component usage
