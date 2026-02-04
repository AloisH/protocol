<script setup lang="ts">
definePageMeta({ layout: false });

const { state, isLoading, isFirstStep, isLastStep, nextStep, previousStep, skipStep, TOTAL_STEPS }
  = useOnboardingWizard();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-900">
    <UCard class="w-full max-w-2xl">
      <template #header>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">
              Welcome to Bistro
            </h2>
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :disabled="isLoading"
              @click="skipStep"
            >
              Skip
            </UButton>
          </div>
          <OnboardingProgress
            :current-step="state.currentStep"
            :total-steps="TOTAL_STEPS"
          />
        </div>
      </template>

      <!-- Step content -->
      <div class="min-h-100">
        <Transition
          name="slide-fade"
          mode="out-in"
        >
          <OnboardingWelcome
            v-if="state.currentStep === 1"
            :key="1"
          />
          <OnboardingProfile
            v-else-if="state.currentStep === 2"
            :key="2"
            v-model="state.profile"
          />
          <OnboardingPreferences
            v-else-if="state.currentStep === 3"
            :key="3"
            v-model="state.preferences"
          />
          <OnboardingUseCase
            v-else-if="state.currentStep === 4"
            :key="4"
            v-model="state.useCase"
          />
          <OnboardingOrganization
            v-else-if="state.currentStep === 5"
            :key="5"
            v-model="state.organization"
          />
          <OnboardingComplete
            v-else-if="state.currentStep === 6"
            :key="6"
          />
        </Transition>
      </div>

      <template #footer>
        <div class="flex justify-between gap-3">
          <UButton
            v-if="!isFirstStep"
            variant="outline"
            color="neutral"
            size="lg"
            :disabled="isLoading"
            @click="previousStep"
          >
            <template #leading>
              <UIcon name="i-lucide-chevron-left" />
            </template>
            Back
          </UButton>
          <div v-else />

          <UButton
            color="primary"
            size="lg"
            :loading="isLoading"
            @click="nextStep"
          >
            {{ isLastStep ? 'Go to Dashboard' : 'Next' }}
            <template
              v-if="!isLastStep"
              #trailing
            >
              <UIcon name="i-lucide-chevron-right" />
            </template>
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
