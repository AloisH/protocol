<script setup lang="ts">
import type { Activity } from '#shared/db/schema';
import { ActivityFormSchema } from '#shared/schemas/activities';

interface Props {
  activity?: Activity;
  protocolId?: string;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [boolean];
  'submit': [data: any];
}>();

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value),
});

const state = reactive({
  name: '',
  activityType: 'habit' as 'warmup' | 'exercise' | 'supplement' | 'habit',
  frequency: 'daily' as 'daily' | 'weekly' | string[],
  timeOfDay: undefined as string | undefined,
  notes: undefined as string | undefined,
  // Exercise fields
  sets: undefined as number | undefined,
  reps: undefined as number | undefined,
  weight: undefined as number | undefined,
  equipmentType: undefined as string | undefined,
  // Supplement fields
  dosage: undefined as number | undefined,
  dosageUnit: undefined as string | undefined,
  timing: undefined as string | undefined,
  // Warmup fields
  duration: undefined as number | undefined,
});

const loading = ref(false);
const validationError = ref<string | null>(null);

const activityTypeOptions = [
  { value: 'habit', label: 'Habit' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'warmup', label: 'Warmup' },
];

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

const dosageUnitOptions = [
  { value: 'mg', label: 'mg' },
  { value: 'ml', label: 'ml' },
  { value: 'tablets', label: 'Tablets' },
  { value: 'capsules', label: 'Capsules' },
  { value: 'drops', label: 'Drops' },
];

watch(
  () => props.activity,
  (activity) => {
    if (activity) {
      state.name = activity.name;
      state.activityType = activity.activityType;
      state.frequency = activity.frequency;
      state.timeOfDay = activity.timeOfDay;
      state.notes = activity.notes;
      state.sets = activity.sets;
      state.reps = activity.reps;
      state.weight = activity.weight;
      state.equipmentType = activity.equipmentType;
      state.dosage = activity.dosage;
      state.dosageUnit = activity.dosageUnit;
      state.timing = activity.timing;
      state.duration = activity.duration;
    }
    else {
      resetForm();
    }
  },
);

function resetForm() {
  state.name = '';
  state.activityType = 'habit';
  state.frequency = 'daily';
  state.timeOfDay = undefined;
  state.notes = undefined;
  state.sets = undefined;
  state.reps = undefined;
  state.weight = undefined;
  state.equipmentType = undefined;
  state.dosage = undefined;
  state.dosageUnit = undefined;
  state.timing = undefined;
  state.duration = undefined;
  validationError.value = null;
}

function getFormData() {
  const data: any = {
    name: state.name,
    activityType: state.activityType,
    frequency: state.frequency,
    timeOfDay: state.timeOfDay,
    notes: state.notes,
  };

  if (state.activityType === 'exercise') {
    data.sets = state.sets;
    data.reps = state.reps;
    data.weight = state.weight;
    data.equipmentType = state.equipmentType;
  }
  else if (state.activityType === 'supplement') {
    data.dosage = state.dosage;
    data.dosageUnit = state.dosageUnit;
    data.timing = state.timing;
  }
  else if (state.activityType === 'warmup') {
    data.duration = state.duration;
  }

  return data;
}

async function onSubmit() {
  validationError.value = null;
  loading.value = true;

  try {
    const formData = getFormData();
    ActivityFormSchema.parse(formData);
    emit('submit', formData);
    isOpen.value = false;
    resetForm();
  }
  catch (e) {
    validationError.value = String(e);
    console.error('Form validation error:', e);
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model="isOpen" title="Add Activity" @close="resetForm">
    <template #body>
      <div class="space-y-4 p-4">
        <UAlert
          v-if="validationError"
          color="red"
          icon="i-lucide-alert-circle"
          :description="validationError"
          @close="validationError = null"
        />

        <UFormField label="Name" required>
          <UInput
            v-model="state.name"
            placeholder="Activity name"
            icon="i-lucide-edit-2"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type" required>
            <USelect
              v-model="state.activityType"
              :options="activityTypeOptions"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormField>

          <UFormField label="Frequency" required>
            <USelect
              v-model="state.frequency"
              :options="frequencyOptions"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormField>
        </div>

        <UFormField label="Time of Day">
          <USelect
            v-model="state.timeOfDay"
            :options="timeOfDayOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Optional"
            :ui="{ base: 'allow-empty' }"
          />
        </UFormField>

        <!-- Exercise fields -->
        <div v-show="state.activityType === 'exercise'" class="space-y-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p class="text-sm font-semibold text-red-900 dark:text-red-200">
            Exercise Details
          </p>

          <div class="grid grid-cols-3 gap-3">
            <UFormField label="Sets">
              <UInput v-model.number="state.sets" type="number" min="1" />
            </UFormField>

            <UFormField label="Reps">
              <UInput v-model.number="state.reps" type="number" min="1" />
            </UFormField>

            <UFormField label="Weight">
              <UInput v-model.number="state.weight" type="number" min="0.1" step="0.1" />
            </UFormField>
          </div>

          <UFormField label="Equipment Type">
            <UInput v-model="state.equipmentType" placeholder="e.g., Barbell, Dumbbell" />
          </UFormField>
        </div>

        <!-- Supplement fields -->
        <div v-show="state.activityType === 'supplement'" class="space-y-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p class="text-sm font-semibold text-blue-900 dark:text-blue-200">
            Supplement Details
          </p>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Dosage">
              <UInput v-model.number="state.dosage" type="number" min="0.1" step="0.1" />
            </UFormField>

            <UFormField label="Unit">
              <USelect
                v-model="state.dosageUnit"
                :options="dosageUnitOptions"
                value-attribute="value"
                option-attribute="label"
                placeholder="Unit"
              />
            </UFormField>
          </div>

          <UFormField label="Timing">
            <UInput v-model="state.timing" placeholder="e.g., with food, before bed" />
          </UFormField>
        </div>

        <!-- Warmup fields -->
        <div v-show="state.activityType === 'warmup'" class="space-y-4 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p class="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
            Warmup Details
          </p>

          <UFormField label="Duration (minutes)">
            <UInput v-model.number="state.duration" type="number" min="1" />
          </UFormField>
        </div>

        <UFormField label="Notes">
          <UTextarea
            v-model="state.notes"
            placeholder="Additional notes"
            rows="3"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton :loading="loading" @click="onSubmit">
          {{ activity ? 'Update' : 'Create' }} Activity
        </UButton>
      </div>
    </template>
  </UModal>
</template>
