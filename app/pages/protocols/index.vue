<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';

useSeoMeta({
  title: 'Protocols - Protocol',
  description: 'Manage your personal routines and protocols',
});

const { protocols, loading, createProtocol, updateProtocol, deleteProtocol, loadProtocols } = useProtocols();
const { activities, loadActivities } = useActivities();

const formOpen = ref(false);
const deleteDialogOpen = ref(false);
const selectedProtocol = ref<Protocol | null>(null);
const isEditMode = ref(false);
const expandedProtocols = ref<Set<string>>(new Set());

const route = useRoute();

onMounted(async () => {
  await loadProtocols();
  await loadActivities();

  // Auto-expand protocol from ?edit= query param
  const editId = route.query.edit as string | undefined;
  if (editId) {
    expandedProtocols.value = new Set([editId]);
  }
});

function openCreateForm() {
  selectedProtocol.value = null;
  isEditMode.value = false;
  formOpen.value = true;
}

function openEditForm(protocol: Protocol) {
  selectedProtocol.value = protocol;
  isEditMode.value = true;
  formOpen.value = true;
}

function openDeleteDialog(protocolOrId: Protocol | string) {
  if (typeof protocolOrId === 'string') {
    const protocol = protocols.value.find(p => p.id === protocolOrId);
    if (protocol) {
      selectedProtocol.value = protocol;
    }
  }
  else {
    selectedProtocol.value = protocolOrId;
  }
  deleteDialogOpen.value = true;
}

function toggleExpanded(protocolId: string) {
  const newSet = new Set(expandedProtocols.value);
  if (newSet.has(protocolId)) {
    newSet.delete(protocolId);
  }
  else {
    newSet.add(protocolId);
  }
  expandedProtocols.value = newSet;
}

async function handleFormSubmit(data: any) {
  try {
    if (isEditMode.value && selectedProtocol.value) {
      await updateProtocol(selectedProtocol.value.id, {
        ...data,
        scheduleDays: data.duration === 'custom' ? data.scheduleDays : undefined,
      });
    }
    else {
      await createProtocol(data.name, data.description, data.duration, 'general', data.scheduleDays);
    }
    formOpen.value = false;
    selectedProtocol.value = null;
  }
  catch (e) {
    console.error('Form submission error:', e);
  }
}

async function handleDeleteConfirm() {
  if (selectedProtocol.value) {
    try {
      await deleteProtocol(selectedProtocol.value.id);
      deleteDialogOpen.value = false;
      selectedProtocol.value = null;
    }
    catch (e) {
      console.error('Delete error:', e);
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">
          Protocols
        </h1>
        <p class="text-gray-600 mt-1">
          Create and manage your personal routines
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        size="lg"
        @click="openCreateForm"
      >
        New Protocol
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <USkeleton v-for="i in 3" :key="i" class="h-64 rounded-lg" />
    </div>

    <!-- Empty State -->
    <div v-else-if="protocols.length === 0" class="text-center py-12">
      <div class="flex justify-center mb-4">
        <UIcon name="i-lucide-inbox" class="text-gray-300 w-16 h-16" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        No protocols yet
      </h3>
      <p class="text-gray-600 mb-6">
        Get started by creating your first protocol
      </p>
      <UButton
        icon="i-lucide-plus"
        @click="openCreateForm"
      >
        Create Protocol
      </UButton>
    </div>

    <!-- Protocols List -->
    <div v-else class="space-y-3">
      <ProtocolCard
        v-for="protocol in protocols"
        :key="protocol.id"
        :protocol="protocol"
        :expanded="expandedProtocols.has(protocol.id)"
        :activity-count="activities.filter(a => a.protocolId === protocol.id).length"
        @edit="openEditForm"
        @delete="openDeleteDialog"
        @toggle="toggleExpanded(protocol.id)"
      />
    </div>
  </div>

  <!-- Create/Edit Form Modal -->
  <ProtocolForm
    v-model="formOpen"
    :protocol="isEditMode ? selectedProtocol || undefined : undefined"
    @submit="handleFormSubmit"
  />

  <!-- Delete Confirmation Dialog -->
  <DeleteProtocolDialog
    v-model="deleteDialogOpen"
    :protocol="selectedProtocol"
    @confirm="handleDeleteConfirm"
  />
</template>
