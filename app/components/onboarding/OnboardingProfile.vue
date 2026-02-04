<script setup lang="ts">
const model = defineModel<{ bio: string; company: string }>({ required: true });
</script>

<template>
  <div class="py-4">
    <div class="mb-6">
      <h2 class="mb-2 text-2xl font-bold">
        Set up your profile
      </h2>
      <p class="text-neutral-600 dark:text-neutral-300">
        Tell us a bit about yourself (all fields optional)
      </p>
    </div>

    <div class="space-y-4">
      <div>
        <label
          for="profile-bio"
          class="mb-2 block text-sm font-medium"
        > Bio </label>
        <UTextarea
          id="profile-bio"
          v-model="model.bio"
          placeholder="Tell us about yourself..."
          :rows="4"
        />
        <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {{ model.bio?.length || 0 }} / 500
        </p>
      </div>

      <div>
        <label
          for="profile-company"
          class="mb-2 block text-sm font-medium"
        > Company / Organization </label>
        <UInput
          id="profile-company"
          v-model="model.company"
          placeholder="Acme Inc."
        />
      </div>
    </div>
  </div>
</template>
