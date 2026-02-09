<script setup lang="ts">
interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
}

defineProps<Props>();

const trendIcon = computed(() => ({
  up: 'i-lucide-trending-up',
  down: 'i-lucide-trending-down',
  stable: 'i-lucide-minus',
}));

const trendColor = computed(() => ({
  up: 'text-green-500',
  down: 'text-red-500',
  stable: 'text-neutral-400',
}));
</script>

<template>
  <UCard>
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ title }}
        </p>
        <p class="text-3xl font-bold mt-1">
          {{ value }}
        </p>
        <p v-if="subtitle" class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UIcon
          v-if="trend"
          :name="trendIcon[trend]"
          class="size-5" :class="[trendColor[trend]]"
        />
        <UIcon
          v-if="icon"
          :name="icon"
          class="size-8 text-neutral-300 dark:text-neutral-600"
        />
      </div>
    </div>
  </UCard>
</template>
