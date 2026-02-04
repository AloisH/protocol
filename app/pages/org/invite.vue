<script setup lang="ts">
const route = useRoute();
const token = route.query.token as string;

const { invite, fetchError, accepting, acceptInvite } = useOrgInvite(token);
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold">
          Organization Invitation
        </h1>
      </template>

      <div
        v-if="fetchError"
        class="py-8"
      >
        <UAlert
          color="error"
          icon="i-lucide-alert-triangle"
          title="Invalid Invitation"
          :description="fetchError.message"
        />
        <UButton
          class="mt-4"
          to="/org/select"
          block
        >
          Go to Organizations
        </UButton>
      </div>

      <div
        v-else-if="invite"
        class="space-y-6"
      >
        <div class="space-y-4">
          <div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              You have been invited to join
            </p>
            <div class="mt-2 flex items-center gap-3">
              <UIcon
                name="i-lucide-building-2"
                class="h-8 w-8 text-neutral-400"
              />
              <div>
                <h2 class="text-xl font-semibold">
                  {{ invite.organization.name }}
                </h2>
                <p
                  v-if="invite.organization.description"
                  class="text-sm text-neutral-500"
                >
                  {{ invite.organization.description }}
                </p>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-500">Email:</span>
                <span class="font-medium">{{ invite.email }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">Role:</span>
                <span class="font-medium">{{ invite.role }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton
            :loading="accepting"
            block
            @click="acceptInvite"
          >
            Accept Invitation
          </UButton>
          <UButton
            variant="ghost"
            to="/org/select"
            :disabled="accepting"
          >
            Decline
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
