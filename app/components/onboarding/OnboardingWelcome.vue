<template>
  <div class="py-8 text-center">
    <div class="mb-6">
      <UIcon
        name="i-lucide-sparkles"
        class="text-primary mx-auto h-16 w-16"
      />
    </div>

    <h1 class="mb-4 text-3xl font-bold">
      Welcome to Bistro!
    </h1>

    <p class="mx-auto mb-6 max-w-md text-lg text-neutral-600 dark:text-neutral-300">
      Let's get you set up in just a few steps. This will only take a minute.
    </p>

    <div class="mx-auto max-w-sm space-y-3 text-left">
      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-user"
          class="text-primary mt-0.5 h-5 w-5"
        />
        <div>
          <p class="font-medium">
            Set up your profile
          </p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Add bio and company info
          </p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-settings"
          class="text-primary mt-0.5 h-5 w-5"
        />
        <div>
          <p class="font-medium">
            Configure preferences
          </p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Customize your experience
          </p>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-briefcase"
          class="text-primary mt-0.5 h-5 w-5"
        />
        <div>
          <p class="font-medium">
            Tell us about yourself
          </p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            Help us tailor Bistro for you
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
