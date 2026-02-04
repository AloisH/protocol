<script setup lang="ts">
import type { ZodSchema } from 'zod';

defineProps<Props>();

const emit = defineEmits<Emits>();

const state = defineModel<{ email: string }>('state', { required: true });

interface Props {
  schema: ZodSchema;
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
    :schema="schema"
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

    <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
      We'll send you a link to sign in without a password.
    </p>

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
      icon="i-lucide-mail"
    >
      Send Magic Link
    </UButton>
  </UForm>
</template>
