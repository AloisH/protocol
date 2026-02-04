<script setup lang="ts">
interface Props {
  type?: 'info' | 'warning' | 'error' | 'success';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
});

const colorClassMap: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
  warning:
    'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  success:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
};

const iconMap: Record<string, string> = {
  info: 'i-lucide-info',
  warning: 'i-lucide-alert-triangle',
  error: 'i-lucide-alert-circle',
  success: 'i-lucide-check-circle',
};

const colorClasses = computed(() => colorClassMap[props.type] || colorClassMap.info);
const icon = computed(() => iconMap[props.type] || 'i-lucide-info');
</script>

<template>
  <div class="my-4 flex gap-2 rounded-md border px-3 py-2 text-sm" :class="[colorClasses]">
    <UIcon
      :name="icon"
      class="mt-0.5 size-4 shrink-0"
    />
    <div class="[&>p]:m-0">
      <slot />
    </div>
  </div>
</template>
