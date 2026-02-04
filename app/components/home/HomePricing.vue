<script setup lang="ts">
const billingPeriod = ref('monthly');
const billingOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly', badge: 'Save 20%' },
];

const plans = {
  free: {
    title: 'Free',
    description: 'Everything you need to stay productive',
    tagline: 'Forever free',
    features: [
      'Unlimited tasks',
      'Unlimited organizations',
      'Team collaboration',
      'Dark mode',
      'Mobile responsive',
      'Open source',
    ],
    button: {
      label: 'Get started',
      to: '/auth/register',
    },
    highlight: true,
    monthly: { price: '$0', discount: '' },
    yearly: { price: '$0', discount: '' },
  },
};

const currentPlans = computed(() => {
  const period = billingPeriod.value as 'monthly' | 'yearly';
  return Object.values(plans).map(plan => ({
    title: plan.title,
    description: plan.description,
    tagline: plan.tagline,
    price: plan[period].price,
    discount: plan[period].discount,
    features: plan.features,
    button: plan.button,
    highlight: plan.highlight,
  }));
});
</script>

<template>
  <UPageSection
    id="pricing"
    title="Simple pricing"
    description="Start free, scale as you grow. No hidden fees."
    class="scroll-animate"
  >
    <div class="mb-8 flex justify-center">
      <UTabs
        v-model="billingPeriod"
        :items="billingOptions"
        size="lg"
      />
    </div>

    <div class="flex justify-center">
      <UPricingPlans
        :plans="currentPlans"
        compact
        class="max-w-sm"
      />
    </div>
  </UPageSection>
</template>
