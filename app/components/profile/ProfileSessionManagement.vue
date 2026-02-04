<script setup lang="ts">
import AdminSessionList from '../admin/AdminSessionList.vue';

interface SessionWithMetadata {
  id: string;
  isCurrent: boolean;
  browser: string;
  os: string;
  device: string;
  ipAddress: string | null;
  createdAt: Date;
  lastActive: Date;
}

const toast = useToast();

const sessions = ref<SessionWithMetadata[]>([]);
const sessionsLoading = ref(false);
const revokeLoading = ref(false);
const showRevokeAllModal = ref(false);

onMounted(() => {
  void fetchSessions();
});

async function fetchSessions() {
  sessionsLoading.value = true;
  try {
    const data = await $fetch('/api/user/sessions');
    sessions.value = data.sessions.map(
      (
        s: Omit<SessionWithMetadata, 'createdAt' | 'lastActive'> & {
          createdAt: string;
          lastActive: string;
        },
      ) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastActive: new Date(s.lastActive),
      }),
    );
  }
  catch (e: unknown) {
    toast.add({
      title: 'Failed to Load Sessions',
      description: getErrorMessage(e, 'Could not load active sessions'),
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    sessionsLoading.value = false;
  }
}

async function revokeSession(sessionId: string) {
  revokeLoading.value = true;
  try {
    await $fetch(`/api/user/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    await fetchSessions();
    toast.add({
      title: 'Session Revoked',
      description: 'The session has been successfully revoked',
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  }
  catch (e: unknown) {
    toast.add({
      title: 'Failed to Revoke Session',
      description: getErrorMessage(e, 'Could not revoke the session'),
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    revokeLoading.value = false;
  }
}

async function revokeAllOthers() {
  revokeLoading.value = true;
  try {
    const data = await $fetch('/api/user/sessions/revoke-others', {
      method: 'POST',
    });
    await fetchSessions();
    showRevokeAllModal.value = false;
    const count = data.count;
    toast.add({
      title: 'Sessions Revoked',
      description: `Successfully revoked ${count} session${count !== 1 ? 's' : ''}`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    });
  }
  catch (e: unknown) {
    toast.add({
      title: 'Failed to Revoke Sessions',
      description: getErrorMessage(e, 'Could not revoke sessions'),
      color: 'error',
      icon: 'i-lucide-alert-circle',
    });
  }
  finally {
    revokeLoading.value = false;
  }
}

defineExpose({
  fetchSessions,
});
</script>

<template>
  <div class="border-default border-b pb-6">
    <div class="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div class="flex-1">
        <div class="mb-1 flex items-center gap-2">
          <h2 class="text-lg font-semibold text-neutral-900 sm:text-xl dark:text-white">
            Active Sessions
          </h2>
          <UBadge
            color="primary"
            variant="subtle"
            size="sm"
          >
            Security
          </UBadge>
        </div>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Manage devices where you're currently logged in
        </p>
      </div>
    </div>

    <AdminSessionList
      :sessions="sessions"
      :loading="sessionsLoading || revokeLoading"
      @revoke="revokeSession"
    />

    <div
      v-if="sessions.length > 1"
      class="border-default mt-6 border-t pt-4"
    >
      <UButton
        color="error"
        variant="outline"
        size="lg"
        class="w-full sm:w-auto"
        @click="showRevokeAllModal = true"
      >
        <template #leading>
          <UIcon
            name="i-lucide-log-out"
            class="mr-2"
          />
        </template>
        Revoke All Other Sessions
      </UButton>
    </div>

    <!-- Revoke All Sessions Modal -->
    <UModal
      v-model:open="showRevokeAllModal"
      title="Revoke All Other Sessions?"
      description="You will be signed out from all devices except this one."
      :ui="{
        footer: 'flex flex-col sm:flex-row gap-3 w-full',
      }"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="warning"
            variant="subtle"
            title="Security Action"
            description="This will sign you out from all other devices. You'll need to log in again on those devices."
          />
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row">
          <UButton
            variant="ghost"
            :disabled="revokeLoading"
            size="lg"
            class="w-full sm:w-auto"
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            type="submit"
            :loading="revokeLoading"
            size="lg"
            class="w-full sm:w-auto"
            @click="revokeAllOthers"
          >
            <template #leading>
              <UIcon
                v-if="!revokeLoading"
                name="i-lucide-log-out"
                class="mr-2"
              />
            </template>
            Revoke All Sessions
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
