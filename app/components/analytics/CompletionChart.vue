<script setup lang="ts">
import type { TrendPoint } from '~/composables/useAnalytics';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'vue-chartjs';

const props = withDefaults(defineProps<Props>(), {
  title: 'Completion Rate',
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  data: TrendPoint[];
  title?: string;
}

const colorMode = useColorMode();

const chartData = computed(() => ({
  labels: props.data.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }),
  datasets: [
    {
      label: 'Completion %',
      data: props.data.map(d => d.rate),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        maxTicksLimit: 7,
        color: colorMode.value === 'dark' ? '#a3a3a3' : '#737373',
      },
    },
    y: {
      min: 0,
      max: 100,
      grid: {
        color: colorMode.value === 'dark' ? '#262626' : '#f5f5f5',
      },
      ticks: {
        color: colorMode.value === 'dark' ? '#a3a3a3' : '#737373',
      },
    },
  },
}) as const);
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">
        {{ title }}
      </h3>
    </template>

    <div class="h-64">
      <Line
        v-if="data.length"
        :data="chartData"
        :options="chartOptions"
      />
      <div
        v-else
        class="h-full flex items-center justify-center text-neutral-500"
      >
        No data available
      </div>
    </div>
  </UCard>
</template>
