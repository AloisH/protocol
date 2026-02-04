<script setup lang="ts">
const {
  activeTab,
  tabItems,
  passwordState,
  passwordLoading,
  passwordError,
  submitPassword,
  magicLinkSchema,
  magicLinkState,
  magicLinkLoading,
  magicLinkError,
  submitMagicLink,
} = useAuthLogin();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h2 class="text-2xl font-bold">
          Login
        </h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Sign in to your account
        </p>
      </template>

      <UTabs
        v-model="activeTab"
        :items="tabItems"
        class="w-full"
      >
        <template #content="{ item }">
          <div class="pt-4">
            <AuthPasswordLoginForm
              v-if="item.value === 'password'"
              v-model:state="passwordState"
              :loading="passwordLoading"
              :error="passwordError"
              @submit="submitPassword"
            />
            <AuthMagicLinkForm
              v-else-if="item.value === 'magic-link'"
              v-model:state="magicLinkState"
              :schema="magicLinkSchema"
              :loading="magicLinkLoading"
              :error="magicLinkError"
              @submit="submitMagicLink"
            />
          </div>
        </template>
      </UTabs>

      <AuthOAuthButtons />

      <template #footer>
        <p class="text-muted text-center text-sm">
          Don't have an account?
          <NuxtLink
            to="/auth/register"
            class="text-primary font-semibold hover:underline"
          >
            Sign up
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
