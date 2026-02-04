<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();
const slug = route.params.slug as string;
const siteUrl = config.public.appUrl || 'http://localhost:3000';

const { post, error, isAdmin } = await useBlogPost(slug);

// 404 if not found or error
if (error.value || !post.value) {
  throw createError({
    statusCode: 404,
    message: 'Post not found',
  });
}

// SEO with computed values (reactive)
const title = computed(() => `${post.value?.title} - Bistro`);
const description = computed(() => post.value?.description || '');

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  ogImage: () => post.value?.image,
  twitterImage: () => post.value?.image,
  articlePublishedTime: () => post.value?.date,
  articleTag: () => post.value?.tags,
});

useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}${route.path}` }],
});

// OG image generation (server only)
if (import.meta.server && post.value) {
  defineOgImageComponent('NuxtSeo', {
    title: post.value.title,
    description: post.value.description,
  });
}
</script>

<template>
  <div class="container mx-auto max-w-4xl px-4 py-12">
    <!-- Draft badge for admins -->
    <UAlert
      v-if="post?.draft && isAdmin"
      color="warning"
      icon="i-lucide-file-edit"
      title="Draft Post"
      description="This post is not published and only visible to admins"
      class="mb-6"
    />

    <article v-if="post">
      <!-- Back button -->
      <div class="mb-8">
        <UButton
          to="/blog"
          variant="ghost"
          icon="i-lucide-arrow-left"
          size="sm"
          class="group"
        >
          <span class="inline-block transition-transform group-hover:-translate-x-1">
            Back to Blog
          </span>
        </UButton>
      </div>

      <BlogPostHero
        :title="post.title"
        :description="post.description"
        :image="post.image"
        :tags="post.tags"
        :date="post.date"
        :author="post.authors?.[0]"
      />

      <!-- Content -->
      <ContentRenderer
        :value="post"
        class="prose dark:prose-invert max-w-none"
      />

      <BlogPostAuthor
        v-if="post.authors?.[0]"
        :name="post.authors[0].name"
        :avatar="post.authors[0].avatar"
      />
    </article>
  </div>
</template>
