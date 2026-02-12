<script setup lang="ts">
import type { Protocol } from '#shared/db/schema';

useSeoMeta({
  title: 'Today - Protocol',
  description: 'Track your daily protocols and monitor progress.',
});

const { todaysProtocols, loading, progress, loadToday, isCompletedToday, toggleCompletion, getStreak } = useDaily();
const { loadActivities } = useActivities();
const streaks = ref<Record<string, number>>({});
const isClient = ref(false);

// Session modal state
const sessionModalOpen = ref(false);
const activeProtocol = ref<Protocol | null>(null);

onMounted(async () => {
  isClient.value = true;
  await loadToday();
  await loadActivities();
  updateBadge(progress.value.total - progress.value.completed);
  // Load streaks for all protocols
  for (const protocol of todaysProtocols.value) {
    streaks.value[protocol.id] = await getStreak(protocol.id);
  }
});

// Reload streaks when completions change
watch(() => todaysProtocols.value, async () => {
  if (!isClient.value)
    return;
  for (const protocol of todaysProtocols.value) {
    streaks.value[protocol.id] = await getStreak(protocol.id);
  }
});

function openSession(protocol: Protocol) {
  activeProtocol.value = protocol;
  sessionModalOpen.value = true;
}

async function quickToggle(protocolId: string) {
  await toggleCompletion(protocolId);
  await loadToday();
  updateBadge(progress.value.total - progress.value.completed);
  streaks.value[protocolId] = await getStreak(protocolId);
}

async function onSessionSaved() {
  await loadToday();
  updateBadge(progress.value.total - progress.value.completed);
  // Update streaks
  for (const protocol of todaysProtocols.value) {
    streaks.value[protocol.id] = await getStreak(protocol.id);
  }
}

const dayLabels: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

function durationLabel(protocol: Protocol) {
  if (protocol.scheduleDays?.length) {
    return protocol.scheduleDays.map(d => dayLabels[d] ?? d).join(', ');
  }
  return protocol.duration;
}

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
});
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {{ formattedDate }}
      </p>
      <h1 class="text-3xl font-bold mt-1">
        Today's Protocols
      </h1>
    </div>

    <!-- Progress Card -->
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Daily Progress
          </p>
          <p class="text-2xl font-bold mt-1">
            {{ progress.completed }} / {{ progress.total }}
          </p>
        </div>
        <div class="relative w-16 h-16">
          <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              stroke-width="8"
              fill="none"
              class="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              stroke-width="8"
              fill="none"
              class="text-primary"
              :stroke-dasharray="`${progress.percentage * 1.76} 176`"
            />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-sm font-semibold">
            {{ progress.percentage }}%
          </span>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <USkeleton v-for="i in 3" :key="i" class="h-24 rounded-lg" />
    </div>

    <!-- Empty State -->
    <UCard v-else-if="todaysProtocols.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-calendar-check" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Nothing scheduled for today
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Create a daily protocol to get started
      </p>
      <UButton to="/protocols" icon="i-lucide-plus">
        Create Protocol
      </UButton>
    </UCard>

    <!-- Protocol List -->
    <div v-else class="space-y-3">
      <div
        v-for="protocol in todaysProtocols"
        :key="protocol.id"
        class="group"
      >
        <UCard
          class="transition-all cursor-pointer" :class="[
            isCompletedToday(protocol.id)
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
              : 'hover:border-gray-300 dark:hover:border-gray-600',
          ]"
          @click="openSession(protocol)"
        >
          <div class="flex items-center gap-4">
            <!-- Checkbox -->
            <button
              type="button"
              class="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all"
              :class="[
                isCompletedToday(protocol.id)
                  ? 'bg-primary border-primary text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary',
              ]"
              @click.stop="quickToggle(protocol.id)"
            >
              <UIcon
                v-if="isCompletedToday(protocol.id)"
                name="i-lucide-check"
                class="w-5 h-5"
              />
            </button>

            <!-- Protocol Info -->
            <div class="flex-1 min-w-0">
              <h3
                class="font-semibold truncate" :class="[
                  isCompletedToday(protocol.id) && 'line-through text-gray-500 dark:text-gray-400',
                ]"
              >
                {{ protocol.name }}
              </h3>
              <p v-if="protocol.description" class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ protocol.description }}
              </p>
            </div>

            <!-- Execute Button -->
            <UButton
              :icon="isCompletedToday(protocol.id) ? 'i-lucide-repeat' : 'i-lucide-play'"
              variant="soft"
              size="sm"
              class="flex-shrink-0"
              :to="`/execute/${protocol.id}`"
              @click.stop
            />

            <!-- Streak Badge -->
            <div v-if="(streaks[protocol.id] ?? 0) > 0" class="flex-shrink-0">
              <UBadge color="warning" variant="soft" class="gap-1">
                <UIcon name="i-lucide-flame" class="w-3 h-3" />
                {{ streaks[protocol.id] }}
              </UBadge>
            </div>

            <!-- Duration Badge -->
            <UBadge color="neutral" variant="soft" class="flex-shrink-0 capitalize">
              {{ durationLabel(protocol) }}
            </UBadge>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-3 pt-4">
      <UButton to="/protocols" variant="outline" icon="i-lucide-list">
        All Protocols
      </UButton>
      <UButton to="/analytics" variant="outline" icon="i-lucide-chart-line">
        Analytics
      </UButton>
    </div>

    <!-- Session Modal -->
    <SessionModal
      v-model="sessionModalOpen"
      :protocol="activeProtocol"
      @saved="onSessionSaved"
    />
  </div>
</template>
