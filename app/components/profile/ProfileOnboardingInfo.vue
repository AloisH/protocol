<script setup lang="ts">
const { user } = useAuth();
</script>

<template>
  <div class="border-default border-b pb-6">
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-neutral-900 sm:text-xl dark:text-white">
        Onboarding Information
      </h2>
      <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Information collected during your initial setup
      </p>
    </div>

    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Bio -->
        <div class="border-default rounded-lg border p-4">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-user"
              class="text-primary mt-0.5 h-5 w-5 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Bio
              </p>
              <p class="mt-1 text-sm text-neutral-900 dark:text-white">
                {{ user?.bio || 'Not provided' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Company -->
        <div class="border-default rounded-lg border p-4">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-briefcase"
              class="text-primary mt-0.5 h-5 w-5 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Company
              </p>
              <p class="mt-1 text-sm text-neutral-900 dark:text-white">
                {{ user?.company || 'Not provided' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Use Case -->
        <div class="border-default rounded-lg border p-4">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-target"
              class="text-primary mt-0.5 h-5 w-5 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Use Case
              </p>
              <p class="mt-1 text-sm text-neutral-900 capitalize dark:text-white">
                {{ user?.useCase || 'Not provided' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Email Notifications -->
        <div class="border-default rounded-lg border p-4">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-mail"
              class="text-primary mt-0.5 h-5 w-5 shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email Notifications
              </p>
              <p class="mt-1 text-sm text-neutral-900 dark:text-white">
                {{ user?.emailNotifications ? 'Enabled' : 'Disabled' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
