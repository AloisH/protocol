<script setup lang="ts">
import { updateProfileSchema } from '#shared/user';

interface Props {
  hasPassword: boolean;
}

defineProps<Props>();

const { user, fetchSession } = useAuth();
const toast = useToast();

const profileState = ref({
  name: user.value?.name || '',
});
const profileLoading = ref(false);

// Track original value for dirty detection
const originalName = ref(user.value?.name || '');
const isDirty = computed(() => profileState.value.name !== originalName.value);

watch(
  () => user.value?.name,
  (newName) => {
    if (newName) {
      profileState.value.name = newName;
      originalName.value = newName;
    }
  },
);

// Warn on navigation with unsaved changes
onBeforeRouteLeave(() => {
  if (isDirty.value) {
    return window.confirm('You have unsaved changes. Leave anyway?');
  }
});

async function updateProfile() {
  profileLoading.value = true;
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: { name: profileState.value.name },
    });
    await fetchSession();
    originalName.value = profileState.value.name; // Reset dirty state
    toast.add({
      title: 'Profile Updated',
      description: 'Your profile information has been saved successfully',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  }
  catch (e: unknown) {
    toast.add({
      title: 'Update Failed',
      description: getErrorMessage(e, 'Failed to update profile. Please try again.'),
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    profileLoading.value = false;
  }
}
</script>

<template>
  <div class="border-default border-b pb-6">
    <h2 class="mb-6 text-lg font-semibold text-neutral-900 sm:text-xl dark:text-white">
      Profile Information
    </h2>
    <UForm
      :state="profileState"
      :schema="updateProfileSchema"
      class="space-y-4"
      @submit.prevent="updateProfile"
    >
      <UFormField
        name="name"
        label="Full Name"
        description="Your display name that appears on your profile"
      >
        <UInput
          v-model="profileState.name"
          placeholder="Your full name"
          autocomplete="name"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <UFormField
        name="email"
        label="Email Address"
        :description="
          hasPassword
            ? 'Your account email address'
            : 'Managed by your OAuth provider (GitHub/Google)'
        "
      >
        <UInput
          :model-value="user?.email"
          disabled
          autocomplete="email"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <div class="pt-4">
        <UButton
          type="submit"
          :loading="profileLoading"
          size="lg"
          class="w-full sm:w-auto"
        >
          <template #leading>
            <UIcon
              v-if="!profileLoading"
              name="i-lucide-save"
              class="mr-2"
            />
          </template>
          Save Changes
        </UButton>
      </div>
    </UForm>
  </div>
</template>
