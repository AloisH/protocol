<script setup lang="ts">
import { signInSchema } from '#shared/auth';

defineProps<Props>();

const emit = defineEmits<Emits>();

const state = defineModel<{ email: string; password: string }>('state', { required: true });

interface Props {
  loading: boolean;
  error: string;
}

interface Emits {
  (e: 'submit'): void;
}
</script>

<template>
  <UForm
    :state="state"
    :schema="signInSchema"
    @submit.prevent="emit('submit')"
  >
    <UFormField
      name="email"
      label="Email"
    >
      <UInput
        v-model="state.email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
      />
    </UFormField>

    <UFormField
      name="password"
      label="Password"
      class="mt-4"
    >
      <UInput
        v-model="state.password"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
      />
    </UFormField>

    <div class="mt-2 flex items-center justify-end">
      <NuxtLink
        to="/auth/forgot-password"
        class="text-primary text-sm font-medium hover:underline"
      >
        Forgot password?
      </NuxtLink>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      :title="error"
      class="mt-4"
    />

    <UButton
      type="submit"
      block
      :loading="loading"
      size="xl"
      class="mt-6 font-semibold"
    >
      Sign in
    </UButton>
  </UForm>
</template>
