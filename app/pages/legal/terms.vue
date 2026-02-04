<script setup lang="ts">
interface LegalPage {
  title: string;
  description: string;
  lastUpdated: string;
  body: unknown;
}

const { data: page } = await useFetch<LegalPage>('/api/legal/terms');

if (!page.value) {
  throw createError({
    statusCode: 404,
    message: 'Page not found',
  });
}

// SEO
useSeo({
  title: page.value.title,
  description: page.value.description,
});
</script>

<template>
  <div class="container mx-auto max-w-4xl px-4 py-12">
    <article v-if="page">
      <!-- Header -->
      <header class="border-default mb-8 border-b pb-8">
        <h1 class="mb-4 text-4xl font-bold text-neutral-900 dark:text-white">
          {{ page.title }}
        </h1>
        <p class="mb-4 text-lg text-neutral-600 dark:text-neutral-400">
          {{ page.description }}
        </p>
        <p class="text-sm text-neutral-500">
          Last updated:
          {{
            new Date(page.lastUpdated).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          }}
        </p>
      </header>

      <!-- Content -->
      <ContentRenderer
        :value="page"
        class="prose dark:prose-invert max-w-none"
      />
    </article>
  </div>
</template>
