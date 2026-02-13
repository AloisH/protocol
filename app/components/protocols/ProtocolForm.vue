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
  duration: (props.protocol?.duration ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  scheduleDays: [...(props.protocol?.scheduleDays ?? [])] as ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[],
});

const loading = ref(false);
const error = ref<string | null>(null);

const durationOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom days', value: 'custom' },
];

const dayOptions = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
] as const;

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

function toggleDay(day: DayKey) {
  const idx = state.scheduleDays.indexOf(day);
  if (idx >= 0) {
    state.scheduleDays.splice(idx, 1);
  }
  else {
    state.scheduleDays.push(day);
  }
}

// Reset scheduleDays when switching away from custom
watch(() => state.duration, (val) => {
  if (val !== 'custom') {
    state.scheduleDays = [];
  }
});

const schema = ProtocolFormSchema;

// Reset form when protocol changes
watch(
  () => props.protocol,
  (newProtocol) => {
    state.name = newProtocol?.name ?? '';
    state.description = newProtocol?.description ?? '';
    state.duration = (newProtocol?.duration ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    state.scheduleDays = newProtocol?.scheduleDays ? [...newProtocol.scheduleDays] as DayKey[] : [];
    error.value = null;
  },
);

async function handleSubmit() {
  error.value = null;
  loading.value = true;

  try {
    const validated = schema.parse(state);
    emit('submit', validated);

    if (!isEditMode.value) {
      state.name = '';
      state.description = '';
      state.duration = 'daily';
      state.scheduleDays = [];
    }

    isOpen.value = false;
  }
  catch (e) {
    error.value = String(e);
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditMode ? 'Edit Protocol' : 'Create Protocol'"
    :description="isEditMode ? 'Update your protocol details' : 'Set up a new routine or protocol'"
    :ui="{ footer: 'justify-end' }"
  >
    <!-- Body slot for form content -->
    <template #body>
      <UForm :state="state" :schema="schema" class="space-y-4" @submit="handleSubmit">
        <UFormField name="name" label="Protocol Name" required>
          <UInput
            v-model="state.name"
            placeholder="e.g., Neck Training"
            icon="i-lucide-zap"
          />
        </UFormField>

        <UFormField name="description" label="Description">
          <UTextarea
            v-model="state.description"
            placeholder="Describe your protocol..."
            :rows="3"
          />
        </UFormField>

        <UFormField name="duration" label="Frequency" required>
          <USelect
            v-model="state.duration"
            :items="durationOptions"
            placeholder="Select frequency"
            class="w-full sm:w-48"
          />
        </UFormField>

        <div v-if="state.duration === 'custom'" class="flex flex-wrap gap-1.5">
          <UButton
            v-for="day in dayOptions"
            :key="day.key"
            size="sm"
            :color="state.scheduleDays.includes(day.key) ? 'primary' : 'neutral'"
            :variant="state.scheduleDays.includes(day.key) ? 'solid' : 'outline'"
            square
            class="rounded-full"
            @click="toggleDay(day.key)"
          >
            {{ day.label }}
          </UButton>
        </div>

        <UAlert
          v-if="error"
          title="Validation Error"
          :description="error"
          color="error"
          icon="i-lucide-alert-circle"
          variant="soft"
        />
      </UForm>
    </template>

    <!-- Footer slot for actions -->
    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        :disabled="loading"
        @click="close"
      >
        Cancel
      </UButton>
      <UButton
        color="primary"
        :loading="loading"
        icon="i-lucide-check"
        @click="handleSubmit"
      >
        {{ isEditMode ? 'Update' : 'Create' }}
      </UButton>
    </template>
  </UModal>
</template>
