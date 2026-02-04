<script setup lang="ts">
interface Props {
  currentStep: number;
  totalSteps: number;
}

defineProps<Props>();

const stepLabels = ['Welcome', 'Profile', 'Preferences', 'Use Case', 'Organization', 'Complete'];
</script>

<template>
  <div class="mb-8 w-full">
    <!-- Progress bar -->
    <UProgress
      :value="(currentStep / totalSteps) * 100"
      size="sm"
      class="mb-6"
    />

    <!-- Step indicators -->
    <div class="flex items-center justify-between">
      <div
        v-for="i in totalSteps"
        :key="i"
        class="flex flex-1 flex-col items-center"
      >
        <div
          class="mb-2 flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors" :class="[
            i <= currentStep
              ? 'bg-primary text-white'
              : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400',
          ]"
        >
          <UIcon
            v-if="i < currentStep"
            name="i-lucide-check"
            class="h-5 w-5"
          />
          <span v-else>{{ i }}</span>
        </div>
        <span
          class="hidden text-center text-xs sm:block" :class="[
            i <= currentStep
              ? 'font-medium text-neutral-900 dark:text-white'
              : 'text-neutral-500 dark:text-neutral-400',
          ]"
        >
          {{ stepLabels[i - 1] }}
        </span>
      </div>
    </div>
  </div>
</template>
