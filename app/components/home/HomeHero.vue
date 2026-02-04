<script setup lang="ts">
const links = [
  {
    label: 'Start for free',
    to: '/auth/register',
    trailingIcon: 'i-lucide-arrow-right',
    size: 'xl' as const,
  },
  {
    label: 'View on GitHub',
    to: 'https://github.com/AloisH/bistro',
    target: '_blank',
    icon: 'i-simple-icons-github',
    size: 'xl' as const,
    color: 'neutral' as const,
    variant: 'subtle' as const,
  },
];
</script>

<template>
  <UPageHero
    headline="100% Free & Open Source"
    title="The simplest way to manage your tasks"
    description="Bistro is a free, open-source todo app that helps you stay organized. No bloat, no complexity - just a clean interface to get things done."
    :links="links"
    :ui="{
      title:
        'animate-gradient-text bg-gradient-to-r from-primary-500 via-green-400 to-primary-600 bg-clip-text text-transparent',
    }"
  />
</template>
