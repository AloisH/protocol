# Onboarding Flow

5-step user onboarding with progress tracking.

## Components

- `OnboardingProgress.vue` - Progress bar and step indicators
  - Props: `currentStep: number`, `totalSteps: number`

- `OnboardingWelcome.vue` - Step 1: Welcome message

- `OnboardingProfile.vue` - Step 2: User profile (name)

- `OnboardingPreferences.vue` - Step 3: User preferences (timezone, notifications)

- `OnboardingUseCase.vue` - Step 4: Primary use case selection

- `OnboardingOrganization.vue` - Step 5: Create organization (name → auto-slug)

- `OnboardingComplete.vue` - Completion screen with confetti

## Flow

1. `/onboarding` page orchestrates flow
2. Step state in URL: `/onboarding?step=2`
3. Profile updates via `/api/user/profile`
4. Org creation via `/api/organizations`
5. Completion sets `user.onboardingCompletedAt`

## Dependencies

- Server: `/api/user/profile`, `/api/organizations`
- Middleware: `auth.global.ts` (protected route)

## Usage

```vue
<script setup lang="ts">
const currentStep = ref(1);
const totalSteps = 5;

function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
    router.push({ query: { step: currentStep.value } });
  }
}
</script>

<template>
  <OnboardingProgress :current-step="currentStep" :total-steps="totalSteps" />

  <OnboardingWelcome v-if="currentStep === 1" @next="nextStep" />
  <OnboardingProfile v-else-if="currentStep === 2" @next="nextStep" />
  <!-- ... -->
</template>
```

**Step labels:** Welcome, Profile, Preferences, Use Case, Organization, Complete

See: [app/CLAUDE.md](../../CLAUDE.md) for page routing
