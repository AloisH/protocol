<script setup lang="ts">
import type { CalendarDay, ProtocolStats, TrendPoint } from '~/composables/useAnalytics';

useSeoMeta({
  title: 'Analytics - Protocol',
  description: 'Track your progress and completion stats',
});

const { getCalendarData, getCompletionTrend, getProtocolStats, getOverallStats } = useAnalytics();
const { protocols, loadProtocols } = useProtocols();

const selectedProtocol = ref<string | null>(null);
const timeRange = ref(30);

const calendarData = ref<CalendarDay[]>([]);
const trendData = ref<TrendPoint[]>([]);
const protocolStats = ref<ProtocolStats[]>([]);
const overallStats = ref({ totalCompletions: 0, avgRate: 0, bestStreak: 0 });

const loading = ref(true);
const error = ref<string | null>(null);

const timeRangeOptions = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const protocolOptions = computed(() => [
  { label: 'All Protocols', value: null },
  ...protocols.value.map(p => ({ label: p.name, value: p.id })),
]);

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const [calendar, trend, stats, overall] = await Promise.all([
      getCalendarData(selectedProtocol.value, timeRange.value),
      getCompletionTrend(selectedProtocol.value, timeRange.value),
      getProtocolStats(timeRange.value),
      getOverallStats(timeRange.value),
    ]);
    calendarData.value = calendar;
    trendData.value = trend;
    protocolStats.value = stats;
    overallStats.value = overall;
  }
  catch (e) {
    error.value = `Failed to load analytics: ${String(e)}`;
  }
  finally {
    loading.value = false;
  }
}

watch([selectedProtocol, timeRange], loadData);

onMounted(async () => {
  await loadProtocols();
  await loadData();
});
</script>

<template>
  <UContainer class="py-8">
    <div class="space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold">
            Analytics
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400 mt-1">
            Track your progress over time
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <USelect
            v-model="selectedProtocol"
            :items="protocolOptions"
            placeholder="Select protocol"
            class="w-full sm:w-40"
          />
          <USelect
            v-model="timeRange"
            :items="timeRangeOptions"
            class="w-full sm:w-28"
          />
        </div>
      </div>

      <UAlert v-if="error" color="error" icon="i-lucide-alert-triangle" :description="error" title="Error" />

      <div v-if="loading" class="grid gap-4 md:grid-cols-3">
        <USkeleton class="h-24" />
        <USkeleton class="h-24" />
        <USkeleton class="h-24" />
      </div>

      <div v-else class="grid gap-4 md:grid-cols-3">
        <AnalyticsMetricCard
          title="Avg Completion Rate"
          :value="`${overallStats.avgRate}%`"
          icon="i-lucide-target"
          :trend="overallStats.avgRate >= 80 ? 'up' : overallStats.avgRate >= 50 ? 'stable' : 'down'"
        />
        <AnalyticsMetricCard
          title="Best Streak"
          :value="`${overallStats.bestStreak} days`"
          icon="i-lucide-flame"
        />
        <AnalyticsMetricCard
          title="Total Completions"
          :value="overallStats.totalCompletions"
          icon="i-lucide-check-circle"
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <AnalyticsCompletionChart
          :data="trendData"
          title="Completion Trend"
        />
        <AnalyticsCompletionCalendar :data="calendarData" />
      </div>

      <UCard v-if="protocolStats.length">
        <template #header>
          <h3 class="font-semibold">
            Protocol Breakdown
          </h3>
        </template>

        <div class="space-y-3">
          <div
            v-for="stat in protocolStats"
            :key="stat.protocolId"
            class="flex items-center justify-between"
          >
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ stat.name }}
              </p>
              <div class="flex items-center gap-4 text-sm text-neutral-500">
                <span>{{ stat.completionRate }}% rate</span>
                <span>{{ stat.streak }} day streak</span>
              </div>
            </div>
            <div class="w-20 sm:w-24 ml-2 sm:ml-4">
              <div class="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-green-500 rounded-full transition-all"
                  :style="{ width: `${stat.completionRate}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
