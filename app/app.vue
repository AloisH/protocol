<script setup lang="ts">
const config = useRuntimeConfig();
const siteUrl = config.public.appUrl || 'http://localhost:3000';

const title = 'Protocol';
const description = 'Personal routine tracking PWA. Set up and monitor daily, weekly, monthly, or yearly protocols.';

const toast = useToast();
const { $pwa } = useNuxtApp();
const isOnline = useOnlineStatus();

// SW update prompt
watch(
  () => $pwa?.needRefresh,
  (needRefresh) => {
    if (!needRefresh)
      return;
    toast.add({
      title: 'Update available',
      description: 'A new version is ready.',
      icon: 'i-lucide-download',
      duration: 0,
      actions: [
        {
          label: 'Reload',
          color: 'primary',
          onClick: () => $pwa?.updateServiceWorker(true),
        },
      ],
    });
  },
);

// PWA Install Prompt
async function installApp() {
  if (!$pwa?.showInstallPrompt)
    return;
  const result = await $pwa.install();
  if (result?.outcome === 'accepted') {
    toast.add({
      title: 'Installed',
      description: 'Protocol installed successfully',
      color: 'success',
      icon: 'i-lucide-check',
    });
  }
}

// WebSite JSON-LD schema
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': title,
  description,
  'url': siteUrl,
};

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: '#10b981' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'Protocol' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon-180x180.png' },
  ],
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

    <!-- Offline Banner -->
    <Transition name="slide">
      <div
        v-if="!isOnline"
        class="bg-warning-500 text-warning-950 fixed top-0 right-0 left-0 z-50 px-4 py-1.5 text-center text-sm font-medium"
      >
        You're offline — changes saved locally
      </div>
    </Transition>

    <!-- Install Prompt Banner -->
    <Teleport to="body">
      <Transition name="slide">
        <div v-if="$pwa?.showInstallPrompt" class="bg-primary fixed bottom-0 left-0 right-0 z-50 p-4 shadow-lg">
          <div class="mx-auto flex max-w-2xl items-center justify-between">
            <div>
              <p class="font-semibold text-white">
                Install Protocol
              </p>
              <p class="text-primary-50 text-sm">
                Add Protocol to your home screen for quick access
              </p>
            </div>
            <div class="flex gap-2">
              <UButton variant="ghost" color="neutral" @click="$pwa?.cancelInstall()">
                Dismiss
              </UButton>
              <UButton color="neutral" @click="installApp">
                Install
              </UButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
