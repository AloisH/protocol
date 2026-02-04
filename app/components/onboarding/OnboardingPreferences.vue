<script setup lang="ts">
const model = defineModel<{ emailNotifications: boolean }>({ required: true });

const colorMode = useColorMode();

const colorModeOptions = [
  { value: 'light', label: 'Light', icon: 'i-lucide-sun' },
  { value: 'dark', label: 'Dark', icon: 'i-lucide-moon' },
  { value: 'system', label: 'System', icon: 'i-lucide-laptop' },
];
</script>

<template>
  <div class="py-4">
    <div class="mb-6">
      <h2 class="mb-2 text-2xl font-bold">
        Configure preferences
      </h2>
      <p class="text-neutral-600 dark:text-neutral-300">
        Customize your Bistro experience
      </p>
    </div>

    <div class="space-y-6">
      <!-- Dark mode -->
      <fieldset>
        <legend class="mb-3 block text-sm font-medium">
          Theme
        </legend>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="option in colorModeOptions"
            :key="option.value"
            type="button"
            class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all" :class="[
              colorMode.preference === option.value
                ? 'border-primary bg-primary/5'
                : 'border-default hover:border-neutral-400 dark:hover:border-neutral-500',
            ]"
            @click="colorMode.preference = option.value as 'light' | 'dark' | 'system'"
          >
            <UIcon
              :name="option.icon"
              class="h-6 w-6"
            />
            <span class="text-sm font-medium">{{ option.label }}</span>
          </button>
        </div>
      </fieldset>

      <!-- Email notifications -->
      <div class="flex items-start gap-3">
        <UCheckbox
          id="email-notifications"
          v-model="model.emailNotifications"
        />
        <div class="flex-1">
          <label
            for="email-notifications"
            class="block cursor-pointer text-sm font-medium"
          >
            Email notifications
          </label>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Receive product updates, tips, and announcements
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
