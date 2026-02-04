<script setup lang="ts">
definePageMeta({
  layout: 'docs',
});

interface DocsPage {
  title: string;
  description: string;
  body: unknown;
}

const { data: page } = await useFetch<DocsPage>('/api/docs/index');

if (!page.value) {
  throw createError({
    statusCode: 404,
    message: 'Documentation not found',
  });
}

useSeo({
  title: page.value.title,
  description: page.value.description,
});
</script>

<template>
  <div class="p-6">
    <div class="max-w-4xl">
      <article v-if="page">
        <header class="mb-8">
          <h1 class="mb-4 text-4xl font-bold text-neutral-900 dark:text-white">
            {{ page.title }}
          </h1>
          <p class="text-xl text-neutral-600 dark:text-neutral-400">
            {{ page.description }}
          </p>
        </header>

        <ContentRenderer
          :value="page"
          class="prose dark:prose-invert max-w-none"
        />
      </article>
    </div>
  </div>
</template>
