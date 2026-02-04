<script setup lang="ts">
const config = useRuntimeConfig();
const { signIn } = useAuth();
const loading = ref<'github' | 'google' | null>(null);

const hasOAuth = computed(
  () => config.public.oauthGithubEnabled || config.public.oauthGoogleEnabled,
);

async function signInWithGithub() {
  loading.value = 'github';
  try {
    const result = await signIn.social({
      provider: 'github',
      callbackURL: config.public.authCallbackUrl,
    });

    // Redirect to OAuth provider (external URL)
    if (result && typeof result === 'object' && 'url' in result && typeof result.url === 'string') {
      await navigateTo(result.url, { external: true });
    }
  }
  catch {
    loading.value = null;
  }
}

async function signInWithGoogle() {
  loading.value = 'google';
  try {
    const result = await signIn.social({
      provider: 'google',
      callbackURL: config.public.authCallbackUrl,
    });

    // Redirect to OAuth provider (external URL)
    if (result && typeof result === 'object' && 'url' in result && typeof result.url === 'string') {
      await navigateTo(result.url, { external: true });
    }
  }
  catch {
    loading.value = null;
  }
}
</script>

<template>
  <div
    v-if="hasOAuth"
    class="mt-6 space-y-3"
  >
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <span class="border-default w-full border-t" />
      </div>
      <div class="relative flex justify-center text-xs uppercase">
        <span class="bg-white px-2 text-neutral-500 dark:bg-neutral-950 dark:text-neutral-400">Or continue with</span>
      </div>
    </div>

    <UButton
      v-if="config.public.oauthGithubEnabled"
      block
      variant="outline"
      :loading="loading === 'github'"
      @click="signInWithGithub"
    >
      <template #leading>
        <UIcon name="i-simple-icons-github" />
      </template>
      Continue with GitHub
    </UButton>

    <UButton
      v-if="config.public.oauthGoogleEnabled"
      block
      variant="outline"
      :loading="loading === 'google'"
      @click="signInWithGoogle"
    >
      <template #leading>
        <UIcon name="i-simple-icons-google" />
      </template>
      Continue with Google
    </UButton>
  </div>
</template>
