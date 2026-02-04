<script setup>
// Auto-refresh session before expiry
useSessionRefresh();

const config = useRuntimeConfig();
const siteUrl = config.public.appUrl || 'http://localhost:3000';

const title = 'Bistro';
const description = 'Production-ready Nuxt 4 SaaS boilerplate with auth, multi-tenancy, and RBAC.';

// WebSite JSON-LD schema
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': title,
  description,
  'url': siteUrl,
};

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en',
  },
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(websiteSchema),
    },
  ],
});

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image',
});

// Dynamic OG image generation
defineOgImageComponent('NuxtSeo', {
  title,
  description,
});
</script>

<template>
  <UApp>
    <!-- Skip to content link for keyboard/screen reader users -->
    <a
      href="#main-content"
      class="focus:bg-primary sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-white focus:outline-none"
    >
      Skip to content
    </a>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
