<script setup lang="ts">
import type { Activity } from '#shared/db/schema';
import { ActivityFormSchema } from '#shared/schemas/activities';

interface DoseState {
  dosage?: number;
  dosageUnit?: string;
  timeOfDay?: string;
  timing?: string;
}

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

const doses = ref<DoseState[]>([]);
const imageData = ref<string | undefined>();
const fileInputRef = ref<HTMLInputElement>();

const state = reactive({
  name: '',
  activityType: 'habit' as 'warmup' | 'exercise' | 'supplement' | 'habit',
  timeOfDay: undefined as string | undefined,
  notes: undefined as string | undefined,
  sets: undefined as number | undefined,
  reps: undefined as number | undefined,
  weight: undefined as number | undefined,
  equipmentType: undefined as string | undefined,
  duration: undefined as number | undefined,
  restTime: undefined as number | undefined,
});

function resizeImage(file: File, maxSize = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
        else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function onFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file)
    return;
  imageData.value = await resizeImage(file);
  if (fileInputRef.value)
    fileInputRef.value.value = '';
}

function removeImage() {
  imageData.value = undefined;
}

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
      state.duration = activity.duration;
      state.restTime = activity.restTime;
      imageData.value = activity.imageData;
      doses.value = activity.doses?.length
        ? activity.doses.map(d => ({ ...d }))
        : [{}];
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
  state.duration = undefined;
  state.restTime = undefined;
  doses.value = [{}];
  imageData.value = undefined;
  validationError.value = null;
}

function getFormData() {
  const data: any = {
    name: state.name,
    activityType: state.activityType,
    timeOfDay: state.timeOfDay,
    notes: state.notes,
    imageData: imageData.value,
  };

  if (state.activityType === 'exercise') {
    data.sets = state.sets;
    data.reps = state.reps;
    data.weight = state.weight;
    data.equipmentType = state.equipmentType;
    data.restTime = state.restTime;
  }
  else if (state.activityType === 'supplement') {
    const nonEmpty = doses.value.filter(d => d.dosage || d.dosageUnit || d.timeOfDay || d.timing);
    if (nonEmpty.length > 0)
      data.doses = nonEmpty;
  }
  else if (state.activityType === 'warmup') {
    data.duration = state.duration;
    data.restTime = state.restTime;
  }

  return data;
}

function addDose() {
  doses.value.push({});
}

function removeDose(index: number) {
  if (doses.value.length > 1)
    doses.value.splice(index, 1);
}

// Init doses when switching to supplement
watch(() => state.activityType, (type) => {
  if (type === 'supplement' && doses.value.length === 0)
    doses.value = [{}];
});

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
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
                <UIcon name="i-lucide-pill" class="h-3.5 w-3.5" />
                Doses
              </div>
              <UButton
                size="xs"
                variant="ghost"
                color="primary"
                icon="i-lucide-plus"
                @click="addDose"
              >
                Add dose
              </UButton>
            </div>

            <div
              v-for="(dose, index) in doses"
              :key="index"
              class="space-y-2 rounded-md border border-blue-200 bg-white/60 p-3 dark:border-blue-800 dark:bg-gray-900/40"
            >
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-gray-500">Dose {{ index + 1 }}</span>
                <UButton
                  v-if="doses.length > 1"
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-x"
                  @click="removeDose(index)"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Dosage">
                  <UInput v-model.number="dose.dosage" type="number" min="0.1" step="0.1" placeholder="500" />
                </UFormField>
                <UFormField label="Unit">
                  <USelect
                    v-model="dose.dosageUnit"
                    :items="dosageUnitOptions"
                    placeholder="Select unit"
                  />
                </UFormField>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Time of Day">
                  <USelect
                    v-model="dose.timeOfDay"
                    :items="timeOfDayOptions"
                    placeholder="Any time"
                  />
                </UFormField>
                <UFormField label="Timing">
                  <UInput v-model="dose.timing" placeholder="With food..." />
                </UFormField>
              </div>
            </div>
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

        <!-- Image -->
        <UFormField label="Image">
          <div class="flex items-center gap-3">
            <div v-if="imageData" class="relative">
              <img :src="imageData" alt="Activity image" class="h-20 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-700">
              <UButton
                icon="i-lucide-x"
                size="xs"
                color="error"
                variant="solid"
                class="absolute -top-2 -right-2 rounded-full"
                @click="removeImage"
              />
            </div>
            <label class="hidden">
              <span>Upload image</span>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                capture="environment"
                @change="onFileSelect"
              >
            </label>
            <UButton
              icon="i-lucide-camera"
              variant="outline"
              color="neutral"
              @click="fileInputRef?.click()"
            >
              {{ imageData ? 'Change' : 'Add photo' }}
            </UButton>
          </div>
        </UFormField>

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
