<script setup lang="ts">
interface Props {
  posts: {
    path: string;
    title: string;
    description?: string;
    image?: string;
    date: string;
    tags?: string[];
    authors?: { name: string; avatar?: { src: string } }[];
  }[];
}

defineProps<Props>();
</script>

<template>
  <div
    v-if="posts?.length"
    class="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
  >
    <NuxtLink
      v-for="(post, index) in posts"
      :key="post.path"
      :to="post.path"
      :style="{ animationDelay: `${index * 50}ms` }"
      class="group animate-fade-in-up block"
    >
      <UCard class="h-full overflow-hidden transition-shadow duration-300 hover:shadow-lg">
        <template #header>
          <div class="relative -m-6 mb-0 aspect-video overflow-hidden">
            <NuxtImg
              :src="post.image"
              :alt="post.title"
              loading="lazy"
              class="h-full w-full object-cover"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          </div>
        </template>

        <div class="p-6">
          <div class="mb-3 flex flex-wrap gap-2">
            <UBadge
              v-for="tag in post.tags?.slice(0, 2)"
              :key="tag"
              variant="subtle"
              color="primary"
              size="xs"
            >
              {{ tag }}
            </UBadge>
          </div>

          <h3
            class="group-hover:text-primary-500 dark:group-hover:text-primary-400 mb-2 text-xl font-semibold text-neutral-900 transition-colors dark:text-white"
          >
            {{ post.title }}
          </h3>

          <p class="mb-4 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
            {{ post.description }}
          </p>

          <div class="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-500">
            <div class="flex items-center gap-2">
              <UAvatar
                v-if="post.authors?.[0]"
                :src="post.authors[0].avatar?.src"
                :alt="post.authors[0].name"
                size="xs"
              />
              <span>{{ post.authors?.[0]?.name }}</span>
            </div>
            <span>•</span>
            <NuxtTime
              :datetime="post.date"
              month="long"
              day="numeric"
              year="numeric"
            />
          </div>
        </div>
      </UCard>
    </NuxtLink>
  </div>

  <p
    v-else
    class="py-12 text-center text-neutral-500"
  >
    No posts found. Check back soon!
  </p>
</template>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
  opacity: 0;
}
</style>
