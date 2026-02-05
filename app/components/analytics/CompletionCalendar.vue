<script setup lang="ts">
import type { CalendarDay } from '~/composables/useAnalytics';

interface Props {
  data: CalendarDay[];
}

const props = defineProps<Props>();

// Group data by week for grid display
const weeks = computed(() => {
  if (!props.data.length)
    return [];

  const result: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Pad first week with empty days
  const firstDate = new Date(props.data[0]!.date);
  const firstDayOfWeek = firstDate.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', completed: false, count: 0 });
  }

  for (const day of props.data) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      result.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add remaining days
  if (currentWeek.length > 0) {
    result.push(currentWeek);
  }

  return result;
});

function getIntensity(count: number): string {
  if (count === 0)
    return 'bg-neutral-100 dark:bg-neutral-800';
  if (count === 1)
    return 'bg-green-200 dark:bg-green-900';
  if (count === 2)
    return 'bg-green-300 dark:bg-green-700';
  if (count === 3)
    return 'bg-green-400 dark:bg-green-600';
  return 'bg-green-500 dark:bg-green-500';
}

function formatDate(dateStr: string): string {
  if (!dateStr)
    return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">
        Completion Calendar
      </h3>
    </template>

    <div class="overflow-x-auto">
      <div class="flex gap-1 min-w-max">
        <div
          v-for="(week, weekIdx) in weeks"
          :key="weekIdx"
          class="flex flex-col gap-1"
        >
          <div
            v-for="(day, dayIdx) in week"
            :key="dayIdx"
            class="size-3 rounded-sm transition-colors" :class="[
              day.date ? getIntensity(day.count) : 'bg-transparent',
            ]"
            :title="day.date ? `${formatDate(day.date)}: ${day.count} completed` : ''"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 mt-4 text-xs text-neutral-500">
      <span>Less</span>
      <div class="size-3 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
      <div class="size-3 rounded-sm bg-green-200 dark:bg-green-900" />
      <div class="size-3 rounded-sm bg-green-300 dark:bg-green-700" />
      <div class="size-3 rounded-sm bg-green-400 dark:bg-green-600" />
      <div class="size-3 rounded-sm bg-green-500" />
      <span>More</span>
    </div>
  </UCard>
</template>
