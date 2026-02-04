# User Feature

User profile and account management.

## Files

- `user-service.ts` - Business logic (profile, deletion)
- `user-repository.ts` - DB queries (user-scoped)

## Dependencies

- Core: `utils/db`
- Features: `email/email-service` (deletion confirmation)
- Shared: `#shared/user`

## API Routes

- GET/PUT `/api/user/profile` - Profile operations
- DELETE `/api/user/account` - Account deletion

## Operations

- Get/update profile
- Delete account (password or email verification)
- Password verification (scrypt)
