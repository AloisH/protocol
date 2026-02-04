# Profile Management

User profile and account management components.

## Components

- `ProfileForm.vue` - Edit name and profile image
  - Updates via `/api/user/profile`

- `ProfileChangePasswordForm.vue` - Password change with current/new/confirm fields
  - Validation: min 8 chars, passwords match

- `ProfileDeleteAccountSection.vue` - Account deletion with confirmation modal
  - Permanent action, deletes all user data

- `ProfileOnboardingInfo.vue` - Display onboarding completion status
  - Shows completion date or "Not completed"

- `ProfileRestartOnboardingButton.vue` - Reset onboarding flow
  - Clears `onboardingCompletedAt`, redirects to `/onboarding`

- `ProfileSessionManagement.vue` - Active session list with revoke capability
  - Shows device, location, last active
  - Current session highlighted

## Dependencies

- Server: `/api/user/profile`, `/api/user/sessions`, `/api/auth/*`
- Composables: Auto-imported (useAuth, useToast)

## Usage

```vue
<script setup lang="ts">
const { user } = useAuth();
const toast = useToast();

async function updateProfile(data: { name: string; image?: string }) {
  await $fetch('/api/user/profile', {
    method: 'PUT',
    body: data,
  });
  toast.add({ title: 'Profile updated', color: 'success' });
}
</script>

<template>
  <ProfileForm />
  <ProfileChangePasswordForm />
  <ProfileOnboardingInfo />
  <ProfileRestartOnboardingButton />
  <ProfileSessionManagement />
  <ProfileDeleteAccountSection />
</template>
```

**Pattern:** Each component is self-contained with own API calls and validation

See: [app/CLAUDE.md](../../CLAUDE.md) for form validation patterns
