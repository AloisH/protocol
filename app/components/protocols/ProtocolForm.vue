<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';
import { ProtocolFormSchema } from '#shared/schemas/protocols';

interface Props {
  protocol?: Protocol;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'submit': [data: any];
}>();

const isEditMode = computed(() => !!props.protocol);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const state = reactive({
  name: props.protocol?.name ?? '',
  description: props.protocol?.description ?? '',
  duration: (props.protocol?.duration ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly',
});

const loading = ref(false);
const error = ref<string | null>(null);

const durationOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const schema = ProtocolFormSchema;

// Reset form when protocol changes
watch(
  () => props.protocol,
  (newProtocol) => {
    state.name = newProtocol?.name ?? '';
    state.description = newProtocol?.description ?? '';
    state.duration = (newProtocol?.duration ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly';
    error.value = null;
  },
);

async function handleSubmit() {
  error.value = null;
  loading.value = true;

  try {
    // Validate
    const validated = schema.parse(state);

    // Call emit with validated data
    emit('submit', validated);

    // Reset form on success
    if (!isEditMode.value) {
      state.name = '';
      state.description = '';
      state.duration = 'daily';
    }

    // Close modal
    isOpen.value = false;
  }
  catch (e) {
    error.value = String(e);
    console.error('Form validation error:', e);
  }
  finally {
    loading.value = false;
  }
}

function handleCancel() {
  error.value = null;
  isOpen.value = false;
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditMode ? 'Edit Protocol' : 'Create Protocol'"
    :description="isEditMode ? 'Update your protocol details' : 'Set up a new routine or protocol'"
  >
    <!-- Form -->
    <UForm :state="state" :schema="schema" class="space-y-4" @submit="handleSubmit">
      <!-- Name -->
      <UFormField name="name" label="Protocol Name *" required>
        <UInput
          v-model="state.name"
          placeholder="e.g., Neck Training"
          icon="i-lucide-zap"
          aria-label="Protocol name"
        />
      </UFormField>

      <!-- Description -->
      <UFormField name="description" label="Description (optional)">
        <UTextarea
          v-model="state.description"
          placeholder="Describe your protocol..."
          rows="3"
          aria-label="Protocol description"
        />
      </UFormField>

      <!-- Duration -->
      <UFormField name="duration" label="Frequency *" required>
        <USelect
          v-model="state.duration"
          :options="durationOptions"
          placeholder="Select frequency"
          aria-label="Protocol frequency"
        />
      </UFormField>

      <!-- Error Message -->
      <UAlert
        v-if="error"
        title="Validation Error"
        :description="error"
        color="error"
        icon="i-lucide-alert-circle"
      />
    </UForm>

    <!-- Actions -->
    <template #footer>
      <div class="flex gap-2 justify-end">
        <UButton
          variant="ghost"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          :loading="loading"
          icon="i-lucide-check"
          @click="handleSubmit"
        >
          {{ isEditMode ? 'Update Protocol' : 'Create Protocol' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
