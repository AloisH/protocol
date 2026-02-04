<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';
import { ProtocolFormSchema } from '#shared/schemas/protocols';

interface Props {
  protocol?: Protocol;
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<{
  submit: [data: any];
  close: [];
}>();

const isEditMode = computed(() => !!props.protocol);

const state = reactive({
  name: props.protocol?.name ?? '',
  description: props.protocol?.description ?? '',
  duration: (props.protocol?.duration ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly',
});

const loading = ref(false);
const error = ref<string | null>(null);

const durationOptions = ['daily', 'weekly', 'monthly', 'yearly'];

const schema = ProtocolFormSchema;

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
  }
  catch (e) {
    error.value = String(e);
    console.error('Form validation error:', e);
  }
  finally {
    loading.value = false;
  }
}

function handleClose() {
  error.value = null;
  emit('close');
}
</script>

<template>
  <UModal :open="open" @close="handleClose">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div>
        <h2 class="text-2xl font-bold">
          {{ isEditMode ? 'Edit Protocol' : 'Create Protocol' }}
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          {{ isEditMode ? 'Update your protocol details' : 'Set up a new routine or protocol' }}
        </p>
      </div>

      <!-- Form -->
      <UForm :state="state" :schema="schema" @submit="handleSubmit">
        <!-- Name -->
        <UFormField name="name" label="Name *">
          <UInput
            v-model="state.name"
            placeholder="e.g., Neck Training"
            icon="i-lucide-zap"
          />
        </UFormField>

        <!-- Description -->
        <UFormField name="description" label="Description (optional)">
          <UTextarea
            v-model="state.description"
            placeholder="Describe your protocol..."
            rows="3"
          />
        </UFormField>

        <!-- Duration -->
        <UFormField name="duration" label="Frequency *">
          <USelect
            v-model="state.duration"
            :options="durationOptions"
            placeholder="Select frequency"
          />
        </UFormField>

        <!-- Error Message -->
        <UAlert
          v-if="error"
          title="Validation Error"
          :description="error"
          color="red"
          icon="i-lucide-alert-circle"
          class="mt-4"
        />

        <!-- Actions -->
        <div class="flex gap-2 justify-end pt-4">
          <UButton
            variant="ghost"
            :disabled="loading"
            @click="handleClose"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            :loading="loading"
            icon="i-lucide-check"
          >
            {{ isEditMode ? 'Update' : 'Create' }}
          </UButton>
        </div>
      </UForm>
    </div>
  </UModal>
</template>
