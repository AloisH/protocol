# Onboarding Components System

Frontend components for 5-step user onboarding flow.

**Related:** onboarding_system.md (backend), authentication_system.md, organizations_system.md

---

## Overview

**Purpose:** Guide new users through profile setup, preferences, organization creation

**Components:** 7 total (Welcome, Progress, Profile, Preferences, UseCase, Organization, Complete)

**Flow:** Linear 5-step progression with visual progress tracking

**State:** URL query params (`?step=2`), backend tracking (User.onboardingSteps JSON)

**Page:** `/home/alois/bistro/app/pages/onboarding.vue`

---

## Architecture

### Component Hierarchy

```
OnboardingPage
├── OnboardingProgress (persistent across all steps)
└── Step components (conditional rendering)
    ├── OnboardingWelcome (step 1)
    ├── OnboardingProfile (step 2)
    ├── OnboardingPreferences (step 3)
    ├── OnboardingUseCase (step 4)
    ├── OnboardingOrganization (step 5)
    └── OnboardingComplete (step 6/final)
```

### State Management

**Local state:**

- `currentStep` - ref tracking current position (1-6)
- `loading` - API call states
- Form data per step (reactive objects)

**Backend persistence:**

- User.onboardingSteps JSON field (incremental save)
- User.onboardingCompleted boolean (final flag)
- User profile fields (bio, company, useCase, emailNotifications)

**URL sync:**

- Query param `?step=N` for resume/back button support
- Updated via `router.push({ query: { step } })`

---

## Component Reference

### OnboardingProgress

**File:** `/home/alois/bistro/app/components/onboarding/OnboardingProgress.vue`

**Purpose:** Visual progress indicator + step labels

**Props:**

```typescript
{
  currentStep: number,  // 1-6
  totalSteps: number    // Always 6
}
```

**Features:**

- UProgress bar (0-100%)
- 6 circular step indicators (numbers or checkmarks)
- Step labels: Welcome, Profile, Preferences, Use Case, Organization, Complete
- Responsive: Labels hidden on mobile (<sm breakpoint)
- Checkmarks for completed steps, numbers for current/future

**Styling:** Primary color for active/completed, gray for pending

**Usage:**

```vue
<OnboardingProgress :current-step="3" :total-steps="6" />
```

---

### OnboardingWelcome

**File:** `/home/alois/bistro/app/components/onboarding/OnboardingWelcome.vue`

**Purpose:** Welcome message, explain what to expect

**Props:** None

**Events:** None (purely presentational, parent handles navigation)

**Content:**

- Sparkles icon (i-lucide-sparkles)
- Welcome heading
- 3 benefit items with icons:
  - Set up profile (i-lucide-user)
  - Configure preferences (i-lucide-settings)
  - Tell us about yourself (i-lucide-briefcase)

**Styling:** Centered layout, max-width constraint, Tailwind + dark mode

---

### OnboardingProfile

**File:** `/home/alois/bistro/app/components/onboarding/OnboardingProfile.vue`

**Purpose:** Collect user bio and company

**Props:** None (v-model pattern via parent)

**Form fields:**

```typescript
{
  bio: string (optional, max 500 chars),
  company: string (optional)
}
```

**Features:**

- Bio textarea with character counter (0/500)
- Company text input
- All fields optional

**Validation:** Max length on bio (500 chars)

**Pattern:** v-model binds to parent state, parent handles submit

---

### OnboardingPreferences

**File:** `/home/alois/bistro/app/components/onboarding/OnboardingPreferences.vue`

**Purpose:** Configure theme and notifications

**Props:** None

**Form fields:**

```typescript
{
  theme: 'light' | 'dark' | 'system',
  emailNotifications: boolean
}
```

**Features:**

- Theme selector: 3 buttons (Light/Dark/System) with icons
  - Uses `useColorMode()` composable
  - Immediately applies selection
- Email notifications checkbox

**Styling:** Icon-based button selection UI, visual active state

**Integration:** useColorMode() for theme persistence

---

### OnboardingUseCase

**File:** `/home/alois/bistro/app/components/onboarding/OnboardingUseCase.vue`

**Purpose:** Understand user's primary use case

**Props:** None

**Form fields:**

```typescript
{
  useCase: 'personal' | 'business' | 'agency' | 'other';
}
```

**Options:**

- Personal - Individual projects
- Business - Company/startup
- Agency - Client work
- Other - Custom input

**Features:**

- Custom radio button UI with icons
- Description text per option
- Visual selection indicator

**Validation:** Required field

---

### OnboardingOrganization

**File:** `/home/alois/bistro/app/components/onboarding/OnboardingOrganization.vue`

**Purpose:** Create first organization

**Props:** None

**Form fields:**

```typescript
{
  name: string (required),
  slug: string (auto-generated),
  description: string (optional)
}
```

**Features:**

- Auto-slugify on name change
  - Uses `slugify()` utility function
  - Converts "My Company" → "my-company"
- Slug preview/edit field
- Description textarea

**Validation:** Uses createOrganizationSchema (Zod)

**API:** POST /api/organizations

---

### OnboardingComplete

**File:** `/home/alois/bistro/app/components/onboarding/OnboardingComplete.vue`

**Purpose:** Celebrate completion, show next steps

**Props:** None

**Events:** None

**Content:**

- Success icon (checkmark)
- Congratulations message
- "What's next?" section with 3 suggested actions
- Button to dashboard

**Styling:** Centered, success color scheme

---

## API Integration

**Endpoints used:**

| Endpoint                           | Method | Purpose        | Step    |
| ---------------------------------- | ------ | -------------- | ------- |
| GET /api/user/onboarding           | GET    | Load progress  | Initial |
| PUT /api/user/onboarding           | PUT    | Save step data | 2-4     |
| POST /api/organizations            | POST   | Create org     | 5       |
| POST /api/user/onboarding/complete | POST   | Mark complete  | 6       |
| POST /api/user/onboarding/skip     | POST   | Skip flow      | Any     |
| POST /api/user/onboarding/restart  | POST   | Reset progress | Any     |

**Save strategy:**

- Step 1: No save (just welcome)
- Steps 2-4: PUT /api/user/onboarding with step data
- Step 5: POST /api/organizations (separate endpoint)
- Step 6: POST /api/user/onboarding/complete

---

## Page Implementation Pattern

**File:** `/home/alois/bistro/app/pages/onboarding.vue`

```vue
<script setup lang="ts">
const route = useRoute();
const router = useRouter();

// Load from URL or default to 1
const currentStep = ref(Number.parseInt(route.query.step as string) || 1);
const totalSteps = 6;
const loading = ref(false);

// Form state per step
const profileData = reactive({ bio: '', company: '' });
const preferencesData = reactive({ theme: 'system', emailNotifications: true });
const useCaseData = reactive({ useCase: '' });
const orgData = reactive({ name: '', slug: '', description: '' });

// Load existing progress
onMounted(async () => {
  const { data } = await useFetch('/api/user/onboarding');
  if (data.value?.currentStep) {
    currentStep.value = data.value.currentStep;
  }
});

// Navigate to next step
async function nextStep(stepData?: any) {
  loading.value = true;

  try {
    // Save current step data
    if (currentStep.value >= 2 && currentStep.value <= 4) {
      await $fetch('/api/user/onboarding', {
        method: 'PUT',
        body: { step: `step${currentStep.value}`, data: stepData },
      });
    }

    // Create org on step 5
    if (currentStep.value === 5) {
      await $fetch('/api/organizations', {
        method: 'POST',
        body: orgData,
      });
    }

    // Complete on step 6
    if (currentStep.value === 6) {
      await $fetch('/api/user/onboarding/complete', { method: 'POST' });
      await navigateTo('/org/[slug]/dashboard');
      return;
    }

    // Move to next step
    currentStep.value++;
    router.push({ query: { step: currentStep.value } });
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to save', color: 'error' });
  } finally {
    loading.value = false;
  }
}

// Skip onboarding
async function skipOnboarding() {
  await $fetch('/api/user/onboarding/skip', { method: 'POST' });
  await navigateTo('/org/[slug]/dashboard');
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-2xl">
      <OnboardingProgress :current-step="currentStep" :total-steps="totalSteps" />

      <OnboardingWelcome v-if="currentStep === 1" />
      <OnboardingProfile v-else-if="currentStep === 2" v-model="profileData" />
      <OnboardingPreferences v-else-if="currentStep === 3" v-model="preferencesData" />
      <OnboardingUseCase v-else-if="currentStep === 4" v-model="useCaseData" />
      <OnboardingOrganization v-else-if="currentStep === 5" v-model="orgData" />
      <OnboardingComplete v-else-if="currentStep === 6" />

      <template #footer>
        <div class="flex justify-between">
          <UButton variant="ghost" @click="skipOnboarding">Skip</UButton>
          <UButton @click="nextStep(/* step data */)" :loading="loading">
            {{ currentStep === 6 ? 'Get Started' : 'Next' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
```

---

## Common Patterns

### V-Model Pattern for Step Components

**Parent binding:**

```vue
<OnboardingProfile v-model="profileData" />
```

**Component implementation:**

```vue
<script setup lang="ts">
const model = defineModel<{ bio: string; company: string }>();
</script>

<template>
  <UFormField name="bio" label="Bio">
    <UTextarea v-model="model.bio" />
  </UFormField>
</template>
```

### Auto-Slugify Pattern

```typescript
import { slugify } from '~/utils/slugify';

watch(
  () => state.name,
  (newName) => {
    if (!state.slug || state.slug === slugify(oldName)) {
      state.slug = slugify(newName);
    }
  },
);
```

### Step Validation

```vue
<script setup lang="ts">
import { z } from 'zod';

const schema = z.object({
  useCase: z.string().min(1, 'Please select a use case'),
});

const state = reactive({ useCase: '' });

function handleNext() {
  const result = schema.safeParse(state);
  if (!result.success) {
    toast.add({ title: 'Validation Error', color: 'error' });
    return;
  }
  emit('next', state);
}
</script>
```

---

## Middleware Integration

**File:** `/home/alois/bistro/app/middleware/auth.global.ts`

**Pattern:** Redirect incomplete onboarding to /onboarding

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip for public routes
  if (publicRoutes.includes(to.path)) return;

  // Skip for onboarding page itself
  if (to.path === '/onboarding') return;

  // Check auth
  const { user } = useAuth();
  if (!user.value) return navigateTo('/auth/login');

  // Redirect to onboarding if not completed
  if (!user.value.onboardingCompleted) {
    return navigateTo('/onboarding');
  }
});
```

---

## Testing Patterns

**Mount with props:**

```typescript
import { mountSuspended } from '@nuxt/test-utils/runtime';
import OnboardingProgress from './OnboardingProgress.vue';

it('shows checkmark for completed steps', async () => {
  const wrapper = await mountSuspended(OnboardingProgress, {
    props: { currentStep: 3, totalSteps: 6 },
  });

  const step1 = wrapper.findAll('.rounded-full')[0];
  expect(step1.html()).toContain('i-lucide-check');
});
```

**Form submission:**

```typescript
it('emits next event with form data', async () => {
  const wrapper = await mountSuspended(OnboardingProfile);

  await wrapper.find('textarea').setValue('My bio');
  await wrapper.find('form').trigger('submit');

  expect(wrapper.emitted('next')).toBeTruthy();
  expect(wrapper.emitted('next')[0][0]).toEqual({ bio: 'My bio', company: '' });
});
```

---

## Styling Guidelines

**Layout:** Centered cards with max-width constraints

**Colors:**

- Primary for active/completed states
- Gray for pending states
- Success green for completion

**Icons:** Lucide icons via `i-lucide-*`

**Responsive:**

- Step labels hidden on mobile (<sm)
- Full layout on tablet+
- Touch-friendly button sizes

**Dark mode:** All components support dark mode via `dark:` Tailwind classes

---

## Related Documentation

- [Onboarding System](./../System/onboarding_system.md) - Backend API, database schema
- [Authentication System](./../System/authentication_system.md) - User auth, middleware
- [Organizations System](./../System/organizations_system.md) - Org creation
- [Adding Pages](./../SOP/adding_pages.md) - Page creation patterns
- Component files: `/home/alois/bistro/app/components/onboarding/CLAUDE.md`

---

_Last updated: 2026-01-06_
