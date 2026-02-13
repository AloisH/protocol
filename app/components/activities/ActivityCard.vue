<script setup lang="ts">
import type { Activity } from '#shared/db/schema';

interface Props {
  activity: Activity;
}

const props = defineProps<Props>();

const _emit = defineEmits<{
  edit: [activity: Activity];
  delete: [activity: Activity];
}>();

const activityTypeIcons: Record<string, string> = {
  exercise: 'i-lucide-dumbbell',
  warmup: 'i-lucide-zap',
  supplement: 'i-lucide-pill',
  habit: 'i-lucide-check-circle',
};

const activityTypeColors: Record<string, string> = {
  exercise: 'bg-red-50 text-red-700',
  warmup: 'bg-yellow-50 text-yellow-700',
  supplement: 'bg-blue-50 text-blue-700',
  habit: 'bg-green-50 text-green-700',
};

const activity = computed(() => props.activity);

const typeLabel = computed(() => {
  const a = activity.value;
  return a.activityType.charAt(0).toUpperCase() + a.activityType.slice(1);
});

const displayDetails = computed(() => {
  const a = activity.value;
  const details = [];

  if (a.activityType === 'exercise') {
    if (a.sets)
      details.push(`${a.sets}x${a.reps || '?'}`);
    if (a.weight)
      details.push(`${a.weight}${a.equipmentType ? ` (${a.equipmentType})` : ''}`);
    if (a.restTime)
      details.push(`${a.restTime}s rest`);
  }
  else if (a.activityType === 'supplement') {
    if (a.doses?.length) {
      for (const dose of a.doses) {
        const parts = [];
        if (dose.dosage)
          parts.push(`${dose.dosage}${dose.dosageUnit || ''}`);
        if (dose.timeOfDay)
          parts.push(dose.timeOfDay);
        if (dose.timing)
          parts.push(dose.timing);
        if (parts.length)
          details.push(parts.join(' — '));
      }
    }
  }
  else if (a.activityType === 'warmup') {
    if (a.duration)
      details.push(`${a.duration}s`);
    if (a.restTime)
      details.push(`${a.restTime}s rest`);
  }

  return details.join(' • ');
});
</script>

<template>
  <div class="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
    <div class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center" :class="activityTypeColors[activity.activityType]">
      <UIcon :name="activityTypeIcons[activity.activityType]" class="h-5 w-5" />
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {{ activity.name }}
        </h3>
        <UBadge size="sm" variant="subtle">
          {{ typeLabel }}
        </UBadge>
      </div>

      <p v-if="displayDetails" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {{ displayDetails }}
      </p>

      <p v-if="activity.notes" class="mt-2 text-sm text-gray-500 dark:text-gray-500">
        {{ activity.notes }}
      </p>
    </div>

    <div class="flex-shrink-0 flex gap-2">
      <UButton
        icon="i-lucide-edit"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="_emit('edit', activity)"
      />
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="sm"
        @click="_emit('delete', activity)"
      />
    </div>
  </div>
</template>
