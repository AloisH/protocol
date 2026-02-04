# Auth Feature

Better Auth integration for authentication.

## Files

- `auth-config.ts` - Better Auth setup (OAuth, email verification)
- `auth-session.ts` - Session helper for API routes

## Dependencies

- Core: `utils/db` (Prisma adapter)
- Features: `email/email-service` (verification emails)

## Usage

- API route: `server/api/auth/[...].ts` (Better Auth catch-all)
- Session check: Import `serverAuth` from `auth-session.ts`

See: server/CLAUDE.md for auth patterns
