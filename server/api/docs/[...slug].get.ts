import { queryCollection } from '@nuxt/content/server';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || 'index';

  // Construct path - slug might be nested like "getting-started/installation"
  const path = slug === 'index' ? '/docs' : `/docs/${slug}`;

  // Fetch doc page
  const page = await queryCollection(event, 'docs').path(path).first();

  if (!page) {
    throw createError({
      statusCode: 404,
      message: 'Documentation page not found',
    });
  }

  return page;
});
