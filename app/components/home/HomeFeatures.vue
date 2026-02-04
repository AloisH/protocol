<script setup lang="ts">
const features = [
  {
    icon: 'i-lucide-list-checks',
    title: 'Simple task management',
    description:
      'Create, organize, and complete tasks with an intuitive interface. No learning curve required.',
  },
  {
    icon: 'i-lucide-filter',
    title: 'Smart filtering',
    description: 'Filter tasks by status, sort by date or priority. Find what you need instantly.',
  },
  {
    icon: 'i-lucide-users',
    title: 'Team collaboration',
    description: 'Create organizations, invite team members, and manage tasks together.',
  },
  {
    icon: 'i-lucide-moon',
    title: 'Dark mode',
    description:
      'Easy on the eyes with automatic dark mode support. Work comfortably day or night.',
  },
  {
    icon: 'i-lucide-smartphone',
    title: 'Works everywhere',
    description: 'Fully responsive design that works beautifully on desktop, tablet, and mobile.',
  },
  {
    icon: 'i-lucide-lock',
    title: 'Secure by default',
    description: 'Your data is yours. Self-host it or trust our secure infrastructure.',
  },
];
</script>

<template>
  <UPageSection
    id="features"
    title="Everything you need, nothing you don't"
    description="Focus on what matters. Bistro keeps task management simple while providing the essentials for personal productivity."
    :features="features"
    class="scroll-animate"
  />
</template>
