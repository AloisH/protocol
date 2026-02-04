<script setup lang="ts">
import { signUpSchema } from '#shared/auth';

const { state, loading, error, submit } = useAuthRegister();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h2 class="text-2xl font-bold">
          Create account
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Sign up to get started
        </p>
      </template>

      <UForm
        :state="state"
        :schema="signUpSchema"
        @submit.prevent="submit"
      >
        <UFormField
          name="name"
          label="Name"
        >
          <UInput
            v-model="state.name"
            type="text"
            placeholder="John Doe"
            autocomplete="name"
          />
        </UFormField>

        <UFormField
          name="email"
          label="Email"
          class="mt-4"
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
          Create account
        </UButton>
      </UForm>

      <AuthOAuthButtons />

      <template #footer>
        <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Already have an account?
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
