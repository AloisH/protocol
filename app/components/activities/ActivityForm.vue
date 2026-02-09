<script setup lang="ts">
import type { Activity } from '#shared/db/schema';
import { ActivityFormSchema } from '#shared/schemas/activities';

interface Props {
  activity?: Activity;
  protocolId?: string;
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<{
  'update:open': [boolean];
  'submit': [data: any];
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const state = reactive({
  name: '',
  activityType: 'habit' as 'warmup' | 'exercise' | 'supplement' | 'habit',
  timeOfDay: undefined as string | undefined,
  notes: undefined as string | undefined,
  sets: undefined as number | undefined,
  reps: undefined as number | undefined,
  weight: undefined as number | undefined,
  equipmentType: undefined as string | undefined,
  dosage: undefined as number | undefined,
  dosageUnit: undefined as string | undefined,
  timing: undefined as string | undefined,
  duration: undefined as number | undefined,
  restTime: undefined as number | undefined,
});

const loading = ref(false);
const validationError = ref<string | null>(null);

const activityTypeOptions = [
  { value: 'habit', label: 'Habit', icon: 'i-lucide-check-circle' },
  { value: 'exercise', label: 'Exercise', icon: 'i-lucide-dumbbell' },
  { value: 'supplement', label: 'Supplement', icon: 'i-lucide-pill' },
  { value: 'warmup', label: 'Warmup', icon: 'i-lucide-zap' },
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

const isEditMode = computed(() => !!props.activity);
const modalTitle = computed(() => isEditMode.value ? 'Edit Activity' : 'New Activity');
const modalDescription = computed(() => {
  if (isEditMode.value)
    return `Editing ${props.activity?.name}`;
  return 'Add an activity to your protocol';
});

watch(
  () => props.activity,
  (activity) => {
    if (activity) {
      state.name = activity.name;
      state.activityType = activity.activityType;
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
      state.restTime = activity.restTime;
    }
    else {
      resetForm();
    }
  },
);

function resetForm() {
  state.name = '';
  state.activityType = 'habit';
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
  state.restTime = undefined;
  validationError.value = null;
}

function getFormData() {
  const data: any = {
    name: state.name,
    activityType: state.activityType,
    timeOfDay: state.timeOfDay,
    notes: state.notes,
  };

  if (state.activityType === 'exercise') {
    data.sets = state.sets;
    data.reps = state.reps;
    data.weight = state.weight;
    data.equipmentType = state.equipmentType;
    data.restTime = state.restTime;
  }
  else if (state.activityType === 'supplement') {
    data.dosage = state.dosage;
    data.dosageUnit = state.dosageUnit;
    data.timing = state.timing;
  }
  else if (state.activityType === 'warmup') {
    data.duration = state.duration;
    data.restTime = state.restTime;
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
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    :description="modalDescription"
    :ui="{ footer: 'justify-end' }"
    @close="resetForm"
  >
    <template #body>
      <div class="space-y-5">
        <UAlert
          v-if="validationError"
          color="error"
          icon="i-lucide-alert-circle"
          :description="validationError"
          variant="soft"
        />

        <!-- Name -->
        <UFormField label="Name" required>
          <UInput
            v-model="state.name"
            placeholder="e.g., Bench Press, Vitamin D"
            icon="i-lucide-text-cursor"
          />
        </UFormField>

        <!-- Type + Time of Day -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type" required>
            <USelect
              v-model="state.activityType"
              :items="activityTypeOptions"
            />
          </UFormField>

          <UFormField label="Time of Day">
            <USelect
              v-model="state.timeOfDay"
              :items="timeOfDayOptions"
              placeholder="Any time"
            />
          </UFormField>
        </div>

        <!-- Exercise details -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="state.activityType === 'exercise'"
            class="space-y-3 rounded-lg border-l-3 border-red-400 bg-red-50/50 p-4 dark:border-red-500 dark:bg-red-950/20"
          >
            <div class="flex items-center gap-2 text-xs font-semibold tracking-wide text-red-600 uppercase dark:text-red-400">
              <UIcon name="i-lucide-dumbbell" class="h-3.5 w-3.5" />
              Exercise Details
            </div>

            <div class="grid grid-cols-3 gap-3">
              <UFormField label="Sets">
                <UInput v-model.number="state.sets" type="number" min="1" placeholder="3" />
              </UFormField>
              <UFormField label="Reps">
                <UInput v-model.number="state.reps" type="number" min="1" placeholder="12" />
              </UFormField>
              <UFormField label="Weight">
                <UInput v-model.number="state.weight" type="number" min="0.1" step="0.1" placeholder="kg" />
              </UFormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Equipment">
                <UInput v-model="state.equipmentType" placeholder="Barbell, Dumbbell..." />
              </UFormField>
              <UFormField label="Rest (sec)">
                <UInput v-model.number="state.restTime" type="number" min="1" placeholder="60" />
              </UFormField>
            </div>
          </div>
        </Transition>

        <!-- Supplement details -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="state.activityType === 'supplement'"
            class="space-y-3 rounded-lg border-l-3 border-blue-400 bg-blue-50/50 p-4 dark:border-blue-500 dark:bg-blue-950/20"
          >
            <div class="flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
              <UIcon name="i-lucide-pill" class="h-3.5 w-3.5" />
              Supplement Details
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Dosage">
                <UInput v-model.number="state.dosage" type="number" min="0.1" step="0.1" placeholder="500" />
              </UFormField>
              <UFormField label="Unit">
                <USelect
                  v-model="state.dosageUnit"
                  :items="dosageUnitOptions"
                  placeholder="Select unit"
                />
              </UFormField>
            </div>

            <UFormField label="Timing">
              <UInput v-model="state.timing" placeholder="With food, before bed..." />
            </UFormField>
          </div>
        </Transition>

        <!-- Warmup details -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="state.activityType === 'warmup'"
            class="space-y-3 rounded-lg border-l-3 border-amber-400 bg-amber-50/50 p-4 dark:border-amber-500 dark:bg-amber-950/20"
          >
            <div class="flex items-center gap-2 text-xs font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
              <UIcon name="i-lucide-zap" class="h-3.5 w-3.5" />
              Warmup Details
            </div>

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Duration (sec)">
                <UInput v-model.number="state.duration" type="number" min="1" placeholder="30" />
              </UFormField>
              <UFormField label="Rest (sec)">
                <UInput v-model.number="state.restTime" type="number" min="1" placeholder="15" />
              </UFormField>
            </div>
          </div>
        </Transition>

        <!-- Notes -->
        <UFormField label="Notes">
          <UTextarea
            v-model="state.notes"
            placeholder="Any additional notes..."
            :rows="2"
          />
        </UFormField>
      </div>
    </template>

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
        @click="onSubmit"
      >
        {{ isEditMode ? 'Update' : 'Create' }}
      </UButton>
    </template>
  </UModal>
</template>
