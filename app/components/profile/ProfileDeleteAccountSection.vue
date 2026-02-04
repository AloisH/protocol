<script setup lang="ts">
import { deleteAccountEmailSchema, deleteAccountPasswordSchema } from '#shared/user';

interface Props {
  hasPassword: boolean;
}

const { hasPassword } = defineProps<Props>();

const { user, signOut } = useAuth();
const toast = useToast();

const showDeleteModal = ref(false);
const deleteState = ref({
  password: '',
  email: '',
});
const deleteLoading = ref(false);

async function deleteAccount() {
  deleteLoading.value = true;
  try {
    const body = hasPassword ? { password: deleteState.value.password } : { email: deleteState.value.email };

    await $fetch('/api/user/account', {
      method: 'DELETE',
      body,
    });
    toast.add({
      title: 'Account Deleted',
      description: 'Your account has been permanently deleted',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
    await signOut({ redirectTo: '/auth/login' });
  }
  catch (e: unknown) {
    toast.add({
      title: 'Deletion Failed',
      description: getErrorMessage(e, 'Failed to delete account. Please verify your credentials.'),
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    deleteLoading.value = false;
  }
}
</script>

<template>
  <div class="pb-6">
    <div class="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
      <div>
        <h2 class="text-lg font-semibold text-red-600 sm:text-xl dark:text-red-400">
          Danger Zone
        </h2>
        <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Once you delete your account, there is no going back. All your data will be permanently
          deleted.
        </p>
      </div>
    </div>
    <UButton
      color="error"
      variant="solid"
      size="lg"
      class="w-full sm:w-auto"
      @click="showDeleteModal = true"
    >
      <template #leading>
        <UIcon
          name="i-lucide-trash-2"
          class="mr-2"
        />
      </template>
      Delete Account
    </UButton>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="showDeleteModal"
      title="Confirm Account Deletion"
      description="This action cannot be undone. All your data will be permanently deleted."
      :ui="{
        footer: 'flex flex-col sm:flex-row gap-3 w-full',
      }"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="error"
            variant="subtle"
            title="Irreversible Action"
            description="Once deleted, your account and all associated data cannot be recovered."
            class="mb-4"
          />

          <div>
            <p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              The following data will be permanently deleted:
            </p>
            <ul class="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-user"
                  class="mt-1 text-neutral-400 dark:text-neutral-500"
                />
                <span>Your user profile and account information</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-folder"
                  class="mt-1 text-neutral-400 dark:text-neutral-500"
                />
                <span>All your projects and their configurations</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-bot"
                  class="mt-1 text-neutral-400 dark:text-neutral-500"
                />
                <span>All AI jobs and their results</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-globe"
                  class="mt-1 text-neutral-400 dark:text-neutral-500"
                />
                <span>All active sessions across devices</span>
              </li>
            </ul>
          </div>

          <UForm
            :state="deleteState"
            :schema="hasPassword ? deleteAccountPasswordSchema : deleteAccountEmailSchema"
            class="space-y-4"
          >
            <UFormField
              v-if="hasPassword"
              name="password"
              label="Enter your password to confirm"
              description="This is required for security verification"
            >
              <UInput
                v-model="deleteState.password"
                type="password"
                placeholder="••••••••"
                size="lg"
              />
            </UFormField>

            <UFormField
              v-else
              name="email"
              label="Enter your email to confirm"
              description="Enter your account email address"
            >
              <UInput
                v-model="deleteState.email"
                type="email"
                :placeholder="user?.email"
                size="lg"
              />
            </UFormField>
          </UForm>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row">
          <UButton
            variant="ghost"
            :disabled="deleteLoading"
            size="lg"
            class="w-full sm:w-auto"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            type="submit"
            :loading="deleteLoading"
            size="lg"
            class="w-full sm:w-auto"
            @click="deleteAccount"
          >
            <template #leading>
              <UIcon
                v-if="!deleteLoading"
                name="i-lucide-trash-2"
                class="mr-2"
              />
            </template>
            Delete Forever
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
