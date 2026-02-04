<script setup lang="ts">
const techStack = [
  { name: 'Nuxt', icon: 'i-simple-icons-nuxtdotjs', url: 'https://nuxt.com' },
  { name: 'Vue', icon: 'i-simple-icons-vuedotjs', url: 'https://vuejs.org' },
  { name: 'Tailwind', icon: 'i-simple-icons-tailwindcss', url: 'https://tailwindcss.com' },
  { name: 'Prisma', icon: 'i-simple-icons-prisma', url: 'https://prisma.io' },
  { name: 'PostgreSQL', icon: 'i-simple-icons-postgresql', url: 'https://postgresql.org' },
  { name: 'TypeScript', icon: 'i-simple-icons-typescript', url: 'https://typescriptlang.org' },
];
</script>

<template>
  <UPageSection class="scroll-animate">
    <div class="text-center">
      <p class="text-muted mb-6 text-sm">
        Built with modern technologies
      </p>
      <div class="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        <NuxtLink
          v-for="(tech, index) in techStack"
          :key="tech.name"
          :to="tech.url"
          target="_blank"
          class="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <UIcon
            :name="tech.icon"
            class="group-hover:text-primary size-8 text-neutral-400 transition-colors duration-300 md:size-10 dark:text-neutral-500"
          />
          <span
            class="text-muted group-hover:text-foreground text-xs transition-colors duration-300"
          >
            {{ tech.name }}
          </span>
        </NuxtLink>
      </div>
    </div>
  </UPageSection>
</template>
