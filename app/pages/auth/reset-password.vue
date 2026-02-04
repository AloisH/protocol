<script setup lang="ts">
import { resetPasswordSchema } from '#shared/auth';

const { state, loading, error, submit } = usePasswordReset();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h2 class="text-2xl font-bold">
          Create new password
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Enter your new password below
        </p>
      </template>

      <UForm
        :state="state"
        :schema="resetPasswordSchema"
        @submit.prevent="submit"
      >
        <UFormField
          name="password"
          label="New password"
        >
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </UFormField>

        <UFormField
          name="confirmPassword"
          label="Confirm password"
          class="mt-4"
        >
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </UFormField>

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
          Reset password
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Remember your password?
          <NuxtLink
            to="/auth/login"
            class="text-primary hover:underline"
          >
            Sign in
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
