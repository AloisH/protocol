<script setup lang="ts">
const { client } = useAuth();
const route = useRoute();
const router = useRouter();
const toast = useToast();

const email = ref(route.query.email as string);

onMounted(() => {
  if (!email.value) {
    toast.add({
      title: 'Email required',
      description: 'Please enter your email first',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
    router.push({ name: 'auth-magic-link' });
  }
});

const { resending, cooldown, canResend, resend } = useResendCooldown();

function resendMagicLink() {
  resend(
    () => client.signIn.magicLink({ email: email.value, callbackURL: '/org/select' }),
    'Check your inbox for login link',
  );
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
            <UIcon
              name="i-lucide-mail-check"
              class="text-primary h-6 w-6"
            />
          </div>
          <div>
            <h2 class="text-2xl font-bold">
              Check your email
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              Magic link sent
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert
          color="info"
          variant="subtle"
          title="Login link sent"
        >
          <template #description>
            <p class="text-sm">
              We sent a login link to <strong>{{ email }}</strong>. Click the link to sign in instantly.
            </p>
          </template>
        </UAlert>

        <div class="space-y-2">
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Didn't receive the email? Check spam or resend.
          </p>

          <UButton
            block
            variant="outline"
            :loading="resending"
            :disabled="!canResend"
            @click="resendMagicLink"
          >
            <template v-if="cooldown > 0">
              Resend in {{ cooldown }}s
            </template>
            <template v-else>
              Resend magic link
            </template>
          </UButton>
        </div>
      </div>

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
