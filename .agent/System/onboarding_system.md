# User Onboarding System

**Related docs:** project_architecture.md, database_schema.md, authentication_system.md

---

## Overview

**Flow:** 5-step guided onboarding
**Tracking:** User.onboardingCompleted, User.onboardingSteps (JSON)
**Pages:** `/onboarding` (single page, multi-step)
**Skippable:** Yes (skip button available)
**Resumable:** Yes (tracks progress in DB)

---

## Onboarding Steps

### Step 1: Welcome

**Component:** `OnboardingWelcome.vue`

**Purpose:** Welcome user, explain benefits

**Actions:**

- Display welcome message
- Show onboarding overview
- Button to start

### Step 2: Profile

**Component:** `OnboardingProfile.vue`

**Purpose:** Collect user profile info

**Fields:**

- `name`: Full name (required)
- `bio`: Short bio (optional)
- `image`: Profile avatar (optional, file upload)

**Validation:**

- Name: 2-50 chars
- Bio: Max 500 chars

### Step 3: Use Case

**Component:** `OnboardingUseCase.vue`

**Purpose:** Understand user intent

**Fields:**

- `company`: Company name (optional)
- `useCase`: Primary use case (required)

**Options:**

- SaaS development
- AI applications
- Internal tools
- Client projects
- Learning/experiments
- Other (custom input)

### Step 4: Preferences

**Component:** `OnboardingPreferences.vue`

**Purpose:** Configure user preferences

**Fields:**

- `emailNotifications`: Receive product updates (boolean, default true)
- Additional settings (planned: theme, language)

### Step 5: Complete

**Component:** `OnboardingComplete.vue`

**Purpose:** Congratulate user, next steps

**Actions:**

- Show success message
- Suggest next actions (create organization, explore dashboard)
- Button to dashboard

---

## Database Schema

**User model fields:**

```prisma
model User {
  // ...existing fields

  onboardingCompleted Boolean @default(false)
  onboardingSteps     Json?    // { step1: true, step2: true, ... }
  bio                 String?
  company             String?
  useCase             String?
  emailNotifications  Boolean  @default(true)
}
```

**Step tracking format:**

```json
{
  "step1": true,
  "step2": true,
  "step3": false,
  "step4": false,
  "step5": false
}
```

---

## API Endpoints

### GET /api/user/onboarding

**Purpose:** Fetch onboarding status

**Response:**

```json
{
  "onboardingCompleted": false,
  "onboardingSteps": {
    "step1": true,
    "step2": true,
    "step3": false,
    "step4": false,
    "step5": false
  },
  "currentStep": 3
}
```

### PUT /api/user/onboarding

**Purpose:** Update onboarding progress

**Body:**

```json
{
  "step": "step3",
  "data": {
    "company": "Acme Inc",
    "useCase": "SaaS development"
  }
}
```

**Response:**

```json
{
  "success": true,
  "onboardingCompleted": false,
  "currentStep": 4
}
```

### POST /api/user/onboarding/complete

**Purpose:** Mark onboarding as complete

**Response:**

```json
{
  "success": true,
  "onboardingCompleted": true
}
```

### POST /api/user/onboarding/skip

**Purpose:** Skip onboarding (still marks as completed)

**Response:**

```json
{
  "success": true,
  "onboardingCompleted": true,
  "skipped": true
}
```

### POST /api/user/onboarding/restart

**Purpose:** Reset onboarding progress (for testing or re-onboarding)

**Response:**

```json
{
  "success": true,
  "onboardingCompleted": false,
  "currentStep": 1
}
```

---

## Implementation

### Onboarding Page

**Location:** `app/pages/onboarding.vue`

**Flow:**

1. Load onboarding status from API
2. Determine current step
3. Display step component
4. Handle step navigation
5. Update progress via API
6. Redirect to dashboard when complete

**Example:**

```vue
<script setup lang="ts">
const currentStep = ref(1);
const loading = ref(false);

const { data: onboarding } = await useFetch('/api/user/onboarding');
currentStep.value = onboarding.value?.currentStep || 1;

async function nextStep(data: any) {
  loading.value = true;
  await $fetch('/api/user/onboarding', {
    method: 'PUT',
    body: { step: `step${currentStep.value}`, data },
  });
  currentStep.value++;
  loading.value = false;
}

async function skipOnboarding() {
  await $fetch('/api/user/onboarding/skip', { method: 'POST' });
  await navigateTo('/org/[slug]/dashboard');
}
</script>

<template>
  <div class="onboarding-container">
    <OnboardingProgress :current="currentStep" :total="5" />

    <OnboardingWelcome v-if="currentStep === 1" @next="nextStep" />
    <OnboardingProfile v-if="currentStep === 2" @next="nextStep" />
    <OnboardingUseCase v-if="currentStep === 3" @next="nextStep" />
    <OnboardingPreferences v-if="currentStep === 4" @next="nextStep" />
    <OnboardingComplete v-if="currentStep === 5" />

    <UButton @click="skipOnboarding" variant="ghost">Skip</UButton>
  </div>
</template>
```

---

## Middleware Integration

**Auth middleware** (`app/middleware/auth.global.ts`):

Checks if user completed onboarding. If not, redirects to `/onboarding`.

**Example:**

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip for public routes
  if (publicRoutes.includes(to.path)) return;

  // Check auth
  const { session, user } = useAuth();
  if (!session.value) return navigateTo('/auth/login');

  // Check onboarding (skip for onboarding page itself)
  if (to.path !== '/onboarding' && !user.value.onboardingCompleted) {
    return navigateTo('/onboarding');
  }
});
```

---

## Progress Tracking

**OnboardingProgress component:**

**Location:** `app/components/onboarding/OnboardingProgress.vue`

**Purpose:** Visual step indicator

**Props:**

- `current`: Current step number
- `total`: Total steps

**Example:**

```vue
<template>
  <div class="flex items-center justify-center gap-2">
    <div
      v-for="step in total"
      :key="step"
      class="h-2 w-12 rounded-full"
      :class="step <= current ? 'bg-primary' : 'bg-gray-200'"
    />
  </div>
</template>
```

---

## Data Persistence

**Strategy:**

1. Save after each step (PUT /api/user/onboarding)
2. Update `onboardingSteps` JSON field
3. Only set `onboardingCompleted=true` when final step or skip

**Benefits:**

- User can resume if they navigate away
- Track completion rate per step (analytics)
- Allow users to go back and edit

---

## Common Patterns

### Loading State

```vue
<script setup lang="ts">
const loading = ref(false);

async function handleNext(data: any) {
  loading.value = true;
  try {
    await nextStep(data);
  } catch (e) {
    toast.add({ title: 'Error', description: 'Failed to save', color: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>
```

### Form Validation

```vue
<script setup lang="ts">
import { z } from 'zod';

const schema = z.object({
  company: z.string().optional(),
  useCase: z.string().min(1, 'Required'),
});

const state = reactive({
  company: '',
  useCase: '',
});

async function onSubmit() {
  await handleNext(state);
}
</script>

<template>
  <UForm :state="state" :schema="schema" @submit="onSubmit">
    <UFormField name="useCase" label="Primary Use Case">
      <UInput v-model="state.useCase" />
    </UFormField>
    <UButton type="submit" :loading="loading">Next</UButton>
  </UForm>
</template>
```

---

## Testing

**Unit tests:** `onboarding/*.test.ts`

**Test coverage:**

- Step navigation
- Form validation
- API integration
- Skip functionality
- Resume from saved state

**Example:**

```typescript
describe('OnboardingUseCase', () => {
  it('requires useCase field', async () => {
    const wrapper = await mountSuspended(OnboardingUseCase);
    await wrapper.find('button[type="submit"]').trigger('click');
    expect(wrapper.text()).toContain('Required');
  });
});
```

---

## Common Gotchas

1. **Middleware redirect loop**: Ensure onboarding page itself is excluded from onboarding check
2. **Step tracking**: Use JSON field for flexibility (can add/remove steps without migration)
3. **Skip vs Complete**: Both set `onboardingCompleted=true`, but skip doesn't collect data
4. **Resume**: Always load current step from API, don't rely on local state
5. **Validation**: Validate on both client (UX) and server (security)

---

## Future Enhancements

**Planned:**

- Analytics: Track completion rate per step
- A/B testing: Test different onboarding flows
- Tooltips: Interactive product tour
- Video tutorials: Embedded walkthrough videos
- Localization: Multi-language support

---
