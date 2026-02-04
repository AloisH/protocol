<script setup>
const config = useRuntimeConfig();
const siteUrl = config.public.appUrl || 'http://localhost:3000';

const title = 'Protocol';
const description = 'Personal routine tracking PWA. Set up and monitor daily, weekly, monthly, or yearly protocols.';

// PWA Install Prompt
const installPrompt = ref<any>(null);
const showInstallPrompt = ref(false);
const toast = useToast();

// Service Worker updates
const swRegistration = ref<ServiceWorkerRegistration | null>(null);

onMounted(() => {
  // Handle install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt.value = e;
    showInstallPrompt.value = true;
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
      swRegistration.value = reg;

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            toast.add({
              title: 'Update available',
              description: 'A new version is ready. Reload to update.',
              color: 'primary',
              actions: [
                {
                  label: 'Reload',
                  click: () => window.location.reload(),
                },
              ],
            });
          }
        });
      });
    });
  }

  // Check for updates periodically
  setInterval(() => {
    swRegistration.value?.update();
  }, 60000); // Check every minute
});

async function installApp() {
  if (!installPrompt.value)
    return;

  installPrompt.value.prompt();
  const { outcome } = await installPrompt.value.userChoice;

  if (outcome === 'accepted') {
    toast.add({
      title: 'Installed',
      description: 'Protocol installed successfully',
      color: 'success',
      icon: 'i-lucide-check',
    });
  }

  installPrompt.value = null;
  showInstallPrompt.value = false;
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
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#10b981' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'Protocol' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'manifest', href: '/manifest.json' },
    { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
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

    <!-- Install Prompt Banner -->
    <Teleport to="body">
      <Transition name="slide">
        <div v-if="showInstallPrompt" class="fixed bottom-0 left-0 right-0 bg-primary p-4 shadow-lg z-50">
          <div class="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p class="text-white font-semibold">
                Install Protocol
              </p>
              <p class="text-primary-50 text-sm">
                Add Protocol to your home screen for quick access
              </p>
            </div>
            <div class="flex gap-2">
              <UButton variant="ghost" color="white" @click="showInstallPrompt = false">
                Dismiss
              </UButton>
              <UButton color="white" @click="installApp">
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
