<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';

useSeoMeta({
  title: 'Protocols - Protocol',
  description: 'Manage your personal routines and protocols',
});

const { protocols, loading, createProtocol, updateProtocol, deleteProtocol } = useProtocols();

const formOpen = ref(false);
const deleteDialogOpen = ref(false);
const selectedProtocol = ref<Protocol | null>(null);
const isEditMode = ref(false);

onMounted(() => {
  useProtocols().loadProtocols();
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

function openDeleteDialog(protocol: Protocol) {
  selectedProtocol.value = protocol;
  deleteDialogOpen.value = true;
}

async function handleFormSubmit(data: any) {
  try {
    if (isEditMode.value && selectedProtocol.value) {
      await updateProtocol(selectedProtocol.value.id, data);
    }
    else {
      await createProtocol(data.name, data.description, data.duration);
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

    <!-- Protocols Grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProtocolCard
        v-for="protocol in protocols"
        :key="protocol.id"
        :protocol="protocol"
        @edit="openEditForm"
        @delete="openDeleteDialog"
      />
    </div>
  </div>

  <!-- Create/Edit Form Modal -->
  <ProtocolForm
    :protocol="isEditMode ? selectedProtocol || undefined : undefined"
    :open="formOpen"
    @submit="handleFormSubmit"
    @close="formOpen = false"
  />

  <!-- Delete Confirmation Dialog -->
  <DeleteProtocolDialog
    :protocol="selectedProtocol"
    :open="deleteDialogOpen"
    @confirm="handleDeleteConfirm"
    @cancel="deleteDialogOpen = false"
  />
</template>
