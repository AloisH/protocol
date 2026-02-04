<script setup lang="ts">
import type { Protocol } from '~/shared/db/schema'

interface Props {
  protocol: Protocol | null
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const loading = ref(false)

async function handleConfirm() {
  loading.value = true
  try {
    emit('confirm')
  }
  finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UModal :open="open" @close="handleCancel">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <UIcon name="i-lucide-alert-triangle" class="text-red-600" />
        </div>
        <div>
          <h3 class="text-lg font-bold">Delete Protocol?</h3>
          <p class="text-sm text-gray-500 mt-1">
            This action cannot be undone.
          </p>
        </div>
      </div>

      <!-- Protocol Info -->
      <div v-if="protocol" class="bg-gray-50 p-4 rounded-lg">
        <p class="font-semibold text-gray-900">{{ protocol.name }}</p>
        <p v-if="protocol.description" class="text-sm text-gray-600 mt-1">
          {{ protocol.description }}
        </p>
      </div>

      <!-- Warning -->
      <UAlert
        title="All routines and tracking data will also be deleted"
        color="red"
        icon="i-lucide-info"
        variant="soft"
      />

      <!-- Actions -->
      <div class="flex gap-3 justify-end">
        <UButton
          variant="ghost"
          @click="handleCancel"
          :disabled="loading"
        >
          Keep It
        </UButton>
        <UButton
          color="red"
          :loading="loading"
          @click="handleConfirm"
          icon="i-lucide-trash-2"
        >
          Delete Protocol
        </UButton>
      </div>
    </div>
  </UModal>
</template>
