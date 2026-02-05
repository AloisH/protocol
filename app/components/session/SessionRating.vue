<script setup lang="ts">
interface Props {
  modelValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined];
}>();

const labels = ['Bad', 'OK', 'Good', 'Great', 'Perfect'];

function setRating(value: number) {
  emit('update:modelValue', props.modelValue === value ? undefined : value);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-1">
      <button
        v-for="i in 5"
        :key="i"
        type="button"
        class="p-1 transition-transform hover:scale-110 focus:outline-none"
        @click="setRating(i)"
      >
        <UIcon
          :name="i <= (modelValue || 0) ? 'i-lucide-star' : 'i-lucide-star'"
          class="h-6 w-6 transition-colors"
          :class="i <= (modelValue || 0)
            ? 'text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'"
        />
      </button>
    </div>
    <p v-if="modelValue" class="text-sm text-gray-600 dark:text-gray-400">
      {{ labels[modelValue - 1] }}
    </p>
  </div>
</template>
