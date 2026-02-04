# Profile Components System

User profile and account management components.

**Related:** authentication_system.md, database_schema.md

---

## Overview

**Purpose:** User profile editing, password management, session control, account deletion

**Components:** 6 total (ProfileForm, ChangePasswordForm, DeleteAccountSection, SessionManagement, OnboardingInfo, RestartOnboardingButton)

**Security:** Password verification for sensitive ops, session revocation, permanent deletion warnings

**Page:** `/home/alois/bistro/app/pages/profile.vue`

---

## Architecture

### Component Organization

```
ProfilePage
├── ProfileForm (name, email display)
├── ChangePasswordForm (current/new/confirm)
├── OnboardingInfo (completion status, display-only)
├── RestartOnboardingButton (reset flow)
├── SessionManagement (active sessions list)
└── DeleteAccountSection (danger zone)
```

### Security Model

**Password-based accounts:**

- Require current password for password change
- Require password confirmation for account deletion

**OAuth accounts:**

- Email managed by provider (disabled field)
- Email confirmation for account deletion
- No password change available

**Session management:**

- View all active sessions
- Revoke individual sessions
- Revoke all other sessions (bulk)
- Cannot revoke current session

---

## Component Reference

### ProfileForm

**File:** `/home/alois/bistro/app/components/profile/ProfileForm.vue`

**Purpose:** Edit user profile (name, email display)

**Props:**

```typescript
{
  hasPassword: boolean; // Show OAuth notice if false
}
```

**Form fields:**

```typescript
{
  name: string; // Editable
  email: string; // Disabled (display only)
}
```

**Features:**

- Name input with validation (updateProfileSchema)
- Email field disabled (read-only)
- Different email description for OAuth vs password accounts
- Auto-sync with useAuth() user state
- Toast notifications for success/error

**API:** PUT /api/user/profile

**Validation:** Zod schema (updateProfileSchema from #shared/user)

**Pattern:** fetchSession() after save to update global state

---

### ChangePasswordForm

**File:** `/home/alois/bistro/app/components/profile/ChangePasswordForm.vue`

**Purpose:** Change account password

**Props:** None

**Form fields:**

```typescript
{
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  revokeOtherSessions: boolean  // Default true
}
```

**Features:**

- Current password verification
- New password confirmation match
- Min 8 chars validation
- Optional: Revoke all other sessions checkbox (default checked)
- Better Auth client integration
- Emits 'changed' event on success

**API:** Better Auth changePassword() method

**Validation:**

- changePasswordSchema (Zod)
- Min 8 chars for new password
- Passwords must match

**Security:** Requires current password, option to invalidate other sessions

**Pattern:**

```vue
<script setup>
const emit = defineEmits<{ changed: [] }>();

async function handleChange() {
  await signIn.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions
  });
  emit('changed');
}
</script>
```

---

### DeleteAccountSection

**File:** `/home/alois/bistro/app/components/profile/DeleteAccountSection.vue`

**Purpose:** Permanent account deletion with confirmation

**Props:**

```typescript
{
  hasPassword: boolean; // Determines confirmation method
}
```

**Modal flow:**

1. Click "Delete Account" button (error color)
2. Modal shows warning + data deletion list
3. Confirm via password OR email (depending on hasPassword)
4. DELETE /api/user/account
5. Sign out and redirect to /auth/login

**Data deletion list:**

- User profile and account info
- All projects and configs
- All AI jobs and results
- All active sessions

**Validation:**

- Password-based: deleteAccountPasswordSchema (password required)
- OAuth-based: deleteAccountEmailSchema (email must match)

**API:** DELETE /api/user/account

**Security:**

- Modal confirmation required
- Credential verification (password or email)
- Irreversible warning alert
- Toast notification before signOut

**Styling:** Red/error color scheme, danger zone warning

---

### SessionManagement

**File:** `/home/alois/bistro/app/components/profile/SessionManagement.vue`

**Purpose:** View and manage active sessions

**Props:** None

**Features:**

- Fetches sessions on mount (GET /api/admin/sessions)
- Delegates rendering to SessionList component
- Individual session revocation
- "Revoke all other sessions" with confirmation modal
- Session count in button label

**State:**

```typescript
const sessions = ref<Session[]>([]);
const revoking = ref(false);
const showRevokeAllModal = ref(false);
```

**Methods:**

- `fetchSessions()` - Load from API
- `handleRevoke(sessionId)` - Revoke single session
- `revokeAllOtherSessions()` - Bulk revoke with confirmation

**Pattern:** Uses `<SessionList>` presentational component for rendering

---

### SessionList

**File:** `/home/alois/bistro/app/components/admin/SessionList.vue`

**Purpose:** Presentational component for session cards

**Props:**

```typescript
{
  sessions: Session[],
  currentSessionId?: string  // Highlighted, revoke disabled
}
```

**Events:**

```typescript
{
  'revoke': [sessionId: string]
}
```

**Display per session:**

- Device type icon (mobile/tablet/desktop)
- Browser + OS
- IP address
- Last active time (relative format)
- Revoke button (disabled for current session)

**Empty state:** "No active sessions" with icon

**Styling:** Card-based layout, current session highlighted

---

### OnboardingInfo

**File:** `/home/alois/bistro/app/components/profile/OnboardingInfo.vue`

**Purpose:** Display onboarding completion status

**Props:** None

**Display:**

- 4 info cards (Bio, Company, Use Case, Email Notifications)
- Shows user data from useAuth()
- Fallback: "Not provided" if field empty
- Icons per card (user, briefcase, clipboard, bell)

**Features:**

- Read-only display
- Pulls from user state
- Graceful empty states

**Pattern:** Display-only component, no API calls

---

### RestartOnboardingButton

**File:** `/home/alois/bistro/app/components/profile/RestartOnboardingButton.vue`

**Purpose:** Reset onboarding flow

**Props:** None

**Flow:**

1. Click button
2. POST /api/user/onboarding/restart
3. Clear localStorage (if any cached state)
4. Fetch updated session
5. Redirect to /onboarding

**API:** POST /api/user/onboarding/restart

**Pattern:**

```vue
<script setup>
async function restartOnboarding() {
  loading.value = true;
  await $fetch('/api/user/onboarding/restart', { method: 'POST' });
  localStorage.clear(); // Clear any cached onboarding state
  await fetchSession(); // Update user.onboardingCompleted
  await navigateTo('/onboarding');
}
</script>
```

**Use case:** Testing, re-onboarding users, fixing incomplete flows

---

## API Integration

**Endpoints:**

| Endpoint                          | Method | Purpose          | Component               |
| --------------------------------- | ------ | ---------------- | ----------------------- |
| PUT /api/user/profile             | PUT    | Update name      | ProfileForm             |
| DELETE /api/user/account          | DELETE | Delete account   | DeleteAccountSection    |
| GET /api/admin/sessions           | GET    | List sessions    | SessionManagement       |
| POST /api/user/onboarding/restart | POST   | Reset onboarding | RestartOnboardingButton |
| Better Auth changePassword        | -      | Change password  | ChangePasswordForm      |

---

## Common Patterns

### Conditional Rendering by Auth Method

```vue
<script setup>
const { user } = useAuth();
const hasPassword = computed(() => {
  // Check if user has password (not OAuth-only)
  return user.value?.accounts?.some((acc) => acc.provider === 'password');
});
</script>

<template>
  <ProfileForm :has-password="hasPassword" />
  <ChangePasswordForm v-if="hasPassword" />
  <DeleteAccountSection :has-password="hasPassword" />
</template>
```

### Modal Confirmation Pattern

```vue
<script setup>
const showModal = ref(false);
const loading = ref(false);

async function handleDangerousAction() {
  loading.value = true;
  try {
    await $fetch('/api/endpoint', { method: 'DELETE' });
    toast.add({ title: 'Success', color: 'success' });
    showModal.value = false;
  } catch (e) {
    toast.add({ title: 'Error', color: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UButton @click="showModal = true">Dangerous Action</UButton>

  <UModal v-model:open="showModal" title="Confirm Action">
    <template #body>
      <UAlert color="error" title="Warning" description="Irreversible" />
      <!-- Confirmation form -->
    </template>
    <template #footer="{ close }">
      <UButton variant="ghost" @click="close">Cancel</UButton>
      <UButton color="error" :loading="loading" @click="handleDangerousAction"> Confirm </UButton>
    </template>
  </UModal>
</template>
```

### Session Fetch After Update

```vue
<script setup>
const { fetchSession } = useAuth();

async function updateProfile() {
  await $fetch('/api/user/profile', { method: 'PUT', body: data });
  await fetchSession(); // Sync global state
  toast.add({ title: 'Saved', color: 'success' });
}
</script>
```

---

## Form Validation

**Schemas:** Defined in `#shared/user`

```typescript
// updateProfileSchema
{
  name: z.string().min(2).max(50)
}

// changePasswordSchema
{
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8)
}
.refine(data => data.newPassword === data.confirmPassword)

// deleteAccountPasswordSchema
{
  password: z.string().min(1, 'Password required')
}

// deleteAccountEmailSchema
{
  email: z.string().email('Valid email required')
}
```

**Pattern:** UForm + Zod schema, auto error display

---

## Security Features

**Password operations:**

- Always require current password for changes
- Min 8 chars for new passwords
- Password confirmation match validation
- Option to revoke other sessions after password change

**Account deletion:**

- Modal confirmation required
- Credential verification (password or email)
- List all data being deleted
- Irreversible warning alert
- Sign out immediately after deletion

**Session management:**

- Cannot revoke current session (prevent lockout)
- Bulk revoke with confirmation
- Displays device/location for security awareness

**OAuth security:**

- Email managed by provider (cannot be changed)
- Account deletion requires email confirmation
- No password operations for OAuth-only accounts

---

## Styling Guidelines

**Danger zones:** Red/error color scheme

**Sections:** Border-separated sections with headings

**Forms:**

- lg size inputs for better UX
- Full width on mobile, auto width on desktop
- Loading states on buttons

**Modals:**

- UAlert for warnings
- Footer with Cancel (ghost) + Confirm (error) buttons
- Responsive footer (column on mobile, row on desktop)

**Icons:**

- Lucide icons (i-lucide-\*)
- Leading icons on buttons
- Icons in info cards and data lists

---

## Testing Patterns

**Form submission:**

```typescript
it('updates profile name', async () => {
  const wrapper = await mountSuspended(ProfileForm, {
    props: { hasPassword: true },
  });

  await wrapper.find('input[name="name"]').setValue('New Name');
  await wrapper.find('form').trigger('submit');

  expect($fetch).toHaveBeenCalledWith('/api/user/profile', {
    method: 'PUT',
    body: { name: 'New Name' },
  });
});
```

**Modal workflow:**

```typescript
it('shows confirmation modal before delete', async () => {
  const wrapper = await mountSuspended(DeleteAccountSection, {
    props: { hasPassword: true },
  });

  await wrapper.find('button').trigger('click'); // Open modal
  expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

  await wrapper.find('input[type="password"]').setValue('password123');
  await wrapper.find('button:contains("Delete Forever")').trigger('click');

  expect($fetch).toHaveBeenCalledWith('/api/user/account', {
    method: 'DELETE',
    body: { password: 'password123' },
  });
});
```

---

## Page Integration Example

**File:** `/home/alois/bistro/app/pages/profile.vue`

```vue
<script setup lang="ts">
const { user } = useAuth();

// Check if user has password auth (not OAuth-only)
const hasPassword = computed(() =>
  user.value?.accounts?.some((acc) => acc.provider === 'credential'),
);
</script>

<template>
  <div class="space-y-8">
    <h1>Profile Settings</h1>

    <ProfileForm :has-password="hasPassword" />

    <ChangePasswordForm v-if="hasPassword" />

    <OnboardingInfo />

    <RestartOnboardingButton />

    <SessionManagement />

    <DeleteAccountSection :has-password="hasPassword" />
  </div>
</template>
```

---

## Related Documentation

- [Authentication System](./../System/authentication_system.md) - Better Auth, session management
- [Database Schema](./../System/database_schema.md) - User model, Session model
- [Adding Pages](./../SOP/adding_pages.md) - Page creation patterns
- Component files: `/home/alois/bistro/app/components/profile/CLAUDE.md`

---

_Last updated: 2026-01-06_
