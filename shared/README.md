# Shared Code - Domain-Based Structure

Shared validation schemas, types, and constants organized by domain feature.

## Structure

```
shared/
├── auth/          # Authentication
├── user/          # User profiles & onboarding
├── todo/          # Todo CRUD
├── organization/  # Multi-tenancy
├── email/         # Email sending
├── impersonation/ # Admin impersonation
└── role/          # User roles (USER/ADMIN/SUPER_ADMIN)
```

Each feature folder contains:

- **schemas.ts** - Zod validation schemas
- **types.ts** - TypeScript interfaces (if non-Zod types exist)
- **constants.ts** - Extracted magic numbers & enums
- **index.ts** - Barrel exports

## Import Pattern

```typescript
// ✅ Import from feature (new pattern)
import { createTodoSchema, MAX_TITLE_LENGTH, CreateTodoInput } from '#shared/todo';
import { PASSWORD_MIN_LENGTH, signInSchema } from '#shared/auth';
import { ROLES, roleSchema } from '#shared/role';

// ❌ Old pattern (removed)
// import { createTodoSchema } from '#shared/schemas/todo';
```

## Adding New Feature

1. Create feature folder: `shared/my-feature/`
2. Add schemas: `my-feature/schemas.ts`
3. Extract constants: `my-feature/constants.ts`
4. Add types if needed: `my-feature/types.ts`
5. Barrel export: `my-feature/index.ts`

Example:

```typescript
// shared/my-feature/constants.ts
export const MY_MAX_LENGTH = 500;

// shared/my-feature/schemas.ts
import { z } from 'zod';
import { MY_MAX_LENGTH } from './constants';

export const mySchema = z.object({
  name: z.string().max(MY_MAX_LENGTH),
});

export type MyInput = z.infer<typeof mySchema>;

// shared/my-feature/index.ts
export * from './schemas';
export * from './constants';
```

## Feature Examples

### auth/

- **Schemas**: signIn, signUp, forgotPassword, resetPassword, magicLink
- **Constants**: PASSWORD_MIN_LENGTH = 8
- **Extras**: access-control.ts (Better Auth admin config)

### user/

- **Schemas**: updateProfile, changePassword, deleteAccount, updateOnboarding
- **Types**: OnboardingState, UserProfile (DB types, not Zod)
- **Constants**: NAME_MAX_LENGTH, BIO_MAX_LENGTH, ONBOARDING_STEPS, USE_CASES

### todo/

- **Schemas**: createTodo, updateTodo, toggleTodo, todoQuery
- **Constants**: MAX_TITLE_LENGTH = 200, TODO_FILTERS, TODO_SORT_OPTIONS

### organization/

- **Schemas**: createOrganization, updateOrganization, inviteMember, updateMemberRole
- **Constants**: SLUG_MIN_LENGTH, ORG_NAME_MAX_LENGTH, ORG_ROLES, SLUG_REGEX

### role/

- **Schemas**: roleSchema, updateRoleSchema
- **Constants**: ROLES = ['USER', 'ADMIN', 'SUPER_ADMIN']

### email/

- **Schemas**: sendEmailSchema

### impersonation/

- **Schemas**: startImpersonationSchema, impersonationLogSchema
- **Constants**: REASON_MAX_LENGTH = 500

## Benefits

✅ **Co-location**: Related schemas/types/constants together
✅ **Scalability**: New features = new folder, no conflicts
✅ **Discoverability**: Clear separation of concerns
✅ **Alignment**: Matches `server/features/` structure
✅ **Maintainability**: Extract all magic numbers for easy updates
