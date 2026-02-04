<script setup lang="ts">
interface Props {
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  date: string;
  author?: { name: string; avatar?: string };
}

withDefaults(defineProps<Props>(), {
  image: '',
  tags: () => [],
  author: undefined,
});
</script>

<template>
  <div class="relative -mx-4 mb-12 sm:mx-0">
    <div class="relative h-[400px] overflow-hidden rounded-3xl">
      <NuxtImg
        v-if="image"
        :src="image"
        :alt="title"
        loading="eager"
        class="h-full w-full object-cover"
      />
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      <!-- Content overlay -->
      <div class="absolute right-0 bottom-0 left-0 p-8 text-white">
        <!-- Tags -->
        <div
          v-if="tags?.length"
          class="mb-4 flex flex-wrap gap-2"
        >
          <UBadge
            v-for="tag in tags"
            :key="tag"
            :to="`/blog?tag=${tag}`"
            variant="solid"
            color="primary"
          >
            {{ tag }}
          </UBadge>
        </div>

        <!-- Title -->
        <h1 class="mb-4 text-4xl font-bold md:text-5xl">
          {{ title }}
        </h1>

        <!-- Description -->
        <p class="mb-6 max-w-3xl text-xl text-neutral-200">
          {{ description }}
        </p>

        <!-- Meta -->
        <div class="flex items-center gap-4">
          <div
            v-if="author"
            class="flex items-center gap-2"
          >
            <UAvatar
              :src="author.avatar"
              :alt="author.name"
            />
            <span class="font-medium">{{ author.name }}</span>
          </div>
          <span v-if="author">•</span>
          <NuxtTime
            :datetime="date"
            month="long"
            day="numeric"
            year="numeric"
          />
        </div>
      </div>
    </div>
  </div>
</template>
