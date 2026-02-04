<script setup lang="ts">
const config = useRuntimeConfig();
const siteUrl = config.public.appUrl || 'http://localhost:3000';

// SoftwareApplication JSON-LD schema
const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  'name': 'Protocol',
  'description':
    'Protocol - Personal routine tracking PWA. Set up daily, weekly, or yearly protocols and track your progress locally.',
  'url': siteUrl,
  'applicationCategory': 'ProductivityApplication',
  'operatingSystem': 'Web',
  'offers': {
    '@type': 'Offer',
    'price': '0',
    'priceCurrency': 'USD',
  },
  'author': {
    '@type': 'Organization',
    'name': 'Protocol',
    'url': siteUrl,
  },
};

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(softwareSchema),
    },
  ],
});

// Refs for scroll animation
const techSection = ref<HTMLElement | null>(null);
const featuresSection = ref<HTMLElement | null>(null);
const testimonialsSection = ref<HTMLElement | null>(null);
const pricingSection = ref<HTMLElement | null>(null);
const faqSection = ref<HTMLElement | null>(null);

const { observe } = useScrollAnimation();

onMounted(() => {
  [
    techSection,
    featuresSection,
    testimonialsSection,
    pricingSection,
    faqSection,
  ].forEach((section) => { observe(section); });
});
</script>

<template>
  <div>
    <HomeHero />
    <HomeTechStack ref="techSection" />
    <HomeFeatures ref="featuresSection" />
    <HomeTestimonials ref="testimonialsSection" />
    <HomePricing ref="pricingSection" />
    <HomeFAQ ref="faqSection" />
  </div>
</template>
