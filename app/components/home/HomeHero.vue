<script setup lang="ts">
const links = [
  {
    label: 'View on GitHub',
    to: 'https://github.com/AloisH/bistro',
    target: '_blank',
    icon: 'i-simple-icons-github',
    size: 'xl' as const,
  },
];
</script>

<template>
  <UPageHero
    headline="100% Free & Open Source"
    title="Local-first PWA"
    description="Bistro is a free, open-source progressive web app that runs entirely on your device. No backend, no cloud, no tracking - complete privacy and control."
    :links="links"
    :ui="{
      title:
        'animate-gradient-text bg-gradient-to-r from-primary-500 via-green-400 to-primary-600 bg-clip-text text-transparent',
    }"
  />
</template>
