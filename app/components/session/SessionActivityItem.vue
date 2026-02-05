<script setup lang="ts">
import type { Activity } from '#shared/db/schema';
import type { ActivityLog } from '~/composables/useSession';

interface Props {
  activity: Activity;
  log: ActivityLog;
}

const _props = defineProps<Props>();

const emit = defineEmits<{
  toggle: [];
  update: [updates: Partial<ActivityLog>];
}>();

const activityTypeIcons: Record<string, string> = {
  exercise: 'i-lucide-dumbbell',
  warmup: 'i-lucide-zap',
  supplement: 'i-lucide-pill',
  habit: 'i-lucide-check-circle',
};

const activityTypeColors: Record<string, string> = {
  exercise: 'text-red-500',
  warmup: 'text-yellow-500',
  supplement: 'text-blue-500',
  habit: 'text-green-500',
};
</script>

<template>
  <div
    class="rounded-lg border p-4 transition-all"
    :class="log.completed
      ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'"
  >
    <!-- Header -->
    <div class="flex items-start gap-3">
      <button
        type="button"
        class="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
        :class="log.completed
          ? 'bg-primary border-primary text-white'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary'"
        @click="emit('toggle')"
      >
        <UIcon v-if="log.completed" name="i-lucide-check" class="w-4 h-4" />
      </button>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <UIcon
            :name="activityTypeIcons[activity.activityType]"
            class="h-4 w-4"
            :class="activityTypeColors[activity.activityType]"
          />
          <h4
            class="font-medium"
            :class="log.completed && 'line-through text-gray-500'"
          >
            {{ activity.name }}
          </h4>
        </div>
      </div>
    </div>

    <!-- Type-specific fields -->
    <div v-if="activity.activityType === 'exercise'" class="mt-4 grid grid-cols-3 gap-3">
      <UFormField label="Sets" size="sm">
        <UInput
          :model-value="log.setsDone"
          type="number"
          min="0"
          size="sm"
          @update:model-value="emit('update', { setsDone: Number($event) || undefined })"
        />
      </UFormField>
      <UFormField label="Reps" size="sm">
        <UInput
          :model-value="log.repsDone"
          type="number"
          min="0"
          size="sm"
          @update:model-value="emit('update', { repsDone: Number($event) || undefined })"
        />
      </UFormField>
      <UFormField label="Weight" size="sm">
        <UInput
          :model-value="log.weightUsed"
          type="number"
          min="0"
          step="0.5"
          size="sm"
          @update:model-value="emit('update', { weightUsed: Number($event) || undefined })"
        />
      </UFormField>
    </div>

    <div v-else-if="activity.activityType === 'warmup'" class="mt-4">
      <div class="w-32">
        <UFormField label="Duration (min)" size="sm">
          <UInput
            :model-value="log.durationTaken"
            type="number"
            min="0"
            size="sm"
            @update:model-value="emit('update', { durationTaken: Number($event) || undefined })"
          />
        </UFormField>
      </div>
    </div>

    <!-- Notes -->
    <div class="mt-3">
      <UInput
        :model-value="log.notes"
        placeholder="Notes..."
        size="sm"
        @update:model-value="emit('update', { notes: String($event) || undefined })"
      />
    </div>
  </div>
</template>
