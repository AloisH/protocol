<script setup lang="ts">
import { changePasswordSchema } from '#shared/user';

interface Emits {
  (e: 'changed'): void;
}

const emit = defineEmits<Emits>();

const { client } = useAuth();
const toast = useToast();

const passwordState = ref({
  currentPassword: '',
  newPassword: '',
  revokeOtherSessions: true,
});
const passwordLoading = ref(false);

async function changePassword() {
  passwordLoading.value = true;
  try {
    await client.changePassword({
      currentPassword: passwordState.value.currentPassword,
      newPassword: passwordState.value.newPassword,
      revokeOtherSessions: passwordState.value.revokeOtherSessions,
    });
    passwordState.value.currentPassword = '';
    passwordState.value.newPassword = '';
    toast.add({
      title: 'Password Updated',
      description: 'Your password has been changed successfully',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    // Emit event if sessions were revoked
    if (passwordState.value.revokeOtherSessions) {
      emit('changed');
    }
  }
  catch (e: unknown) {
    toast.add({
      title: 'Password Change Failed',
      description: getErrorMessage(e, 'Failed to change password. Please check your current password.'),
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    passwordLoading.value = false;
  }
}
</script>

<template>
  <div class="border-default border-b pb-6">
    <div class="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-semibold text-neutral-900 sm:text-xl dark:text-white">
          Change Password
        </h2>
        <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Update your password to keep your account secure
        </p>
      </div>
      <UBadge
        color="neutral"
        variant="subtle"
        class="mt-2 sm:mt-0"
      >
        Security
      </UBadge>
    </div>
    <UForm
      :state="passwordState"
      :schema="changePasswordSchema"
      class="space-y-4"
      @submit.prevent="changePassword"
    >
      <UFormField
        name="currentPassword"
        label="Current Password"
        description="Enter your current password for verification"
      >
        <UInput
          v-model="passwordState.currentPassword"
          type="password"
          placeholder="••••••••"
          size="lg"
        />
      </UFormField>

      <UFormField
        name="newPassword"
        label="New Password"
        description="Choose a strong password with at least 8 characters"
      >
        <UInput
          v-model="passwordState.newPassword"
          type="password"
          placeholder="••••••••"
          size="lg"
        />
      </UFormField>

      <UFormField
        name="revokeOtherSessions"
        class="pt-2"
      >
        <template #label>
          <label class="flex cursor-pointer items-center gap-3">
            <UCheckbox v-model="passwordState.revokeOtherSessions" />
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Sign out from all other devices
            </span>
          </label>
        </template>
        <template #description>
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Recommended for security when changing passwords
          </p>
        </template>
      </UFormField>

      <div class="pt-4">
        <UButton
          type="submit"
          :loading="passwordLoading"
          size="lg"
          color="primary"
          class="w-full sm:w-auto"
        >
          <template #leading>
            <UIcon
              v-if="!passwordLoading"
              name="i-lucide-lock"
              class="mr-2"
            />
          </template>
          Update Password
        </UButton>
      </div>
    </UForm>
  </div>
</template>
