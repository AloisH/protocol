<script setup lang="ts">
import { magicLinkSchema } from '#shared/auth';

const { state, loading, error, submit } = useMagicLink();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h2 class="text-2xl font-bold">
          Magic Link Login
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Enter your email to receive a login link
        </p>
      </template>

      <UForm
        :state="state"
        :schema="magicLinkSchema"
        @submit.prevent="submit"
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
          Send magic link
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Prefer a password?
          <NuxtLink
            to="/auth/login"
            class="text-primary hover:underline"
          >
            Sign in with password
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
