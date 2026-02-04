<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const { client } = useAuth();
const toast = useToast();

const email = ref(route.query.email as string);

onMounted(() => {
  if (!email.value) {
    toast.add({
      title: 'Email required',
      description: 'Please register first',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
    router.push({ name: 'auth-register' });
  }
});

const { resending, cooldown, canResend, resend } = useResendCooldown();

function resendVerification() {
  resend(
    () => client.sendVerificationEmail({ email: email.value, callbackURL: '/org/select' }),
    'Check your inbox for verification link',
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
              Verify to continue
            </p>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <UAlert
          color="info"
          variant="subtle"
          title="Verification email sent"
        >
          <template #description>
            <p class="text-sm">
              We sent a verification link to <strong>{{ email }}</strong>. Click the link to verify your account and sign in.
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
            @click="resendVerification"
          >
            <template v-if="cooldown > 0">
              Resend in {{ cooldown }}s
            </template>
            <template v-else>
              Resend verification email
            </template>
          </UButton>
        </div>
      </div>

      <template #footer>
        <p class="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Already verified?
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
