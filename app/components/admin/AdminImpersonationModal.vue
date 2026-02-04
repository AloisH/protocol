<script setup lang="ts">
import type { AdminUser } from '~/composables/admin/useAdminUsers';

interface Props {
  user: AdminUser | null;
  loading: boolean;
}

defineProps<Props>();

defineEmits<Emits>();

interface Emits {
  (e: 'confirm'): void;
}

const model = defineModel<boolean>({ required: true });
const reason = defineModel<string>('reason', { required: true });
</script>

<template>
  <UModal v-model:open="model">
    <template #content="{ close }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              Impersonate User
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              aria-label="Close modal"
              @click="close"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              You are about to impersonate:
            </p>
            <p class="mt-1 font-semibold">
              {{ user?.name || user?.email }}
            </p>
            <p class="text-sm text-neutral-500">
              {{ user?.email }}
            </p>
          </div>

          <UFormField
            label="Reason (optional)"
            help="Document why you're impersonating this user"
          >
            <UTextarea
              v-model="reason"
              placeholder="e.g., Debug checkout issue"
              :rows="3"
            />
          </UFormField>

          <UAlert
            color="warning"
            icon="i-lucide-alert-triangle"
            title="Important"
            description="Some actions are restricted during impersonation. The session will auto-expire after 1 hour."
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              @click="close"
            >
              Cancel
            </UButton>
            <UButton
              color="warning"
              :loading="loading"
              @click="$emit('confirm')"
            >
              Start Impersonating
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
