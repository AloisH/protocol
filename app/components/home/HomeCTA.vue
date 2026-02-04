<script setup lang="ts">
const { email, subscribing, subscribe } = useNewsletter();
</script>

<template>
  <UPageSection
    id="early-access"
    class="scroll-animate"
  >
    <UPageCTA
      title="Get early access to new features"
      description="Join our newsletter to be the first to know about updates, new features, and tips to boost your productivity."
      variant="subtle"
    >
      <template #links>
        <form
          class="flex w-full max-w-md flex-col gap-3 sm:flex-row"
          @submit.prevent="subscribe"
        >
          <UInput
            v-model="email"
            type="email"
            placeholder="Enter your email"
            size="lg"
            class="flex-1"
            required
          />
          <UButton
            type="submit"
            size="lg"
            :loading="subscribing"
          >
            Subscribe
          </UButton>
        </form>
      </template>
    </UPageCTA>
  </UPageSection>
</template>
