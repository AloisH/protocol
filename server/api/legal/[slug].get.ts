import { queryCollection } from '@nuxt/content/server';

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug || (slug !== 'privacy' && slug !== 'terms')) {
    throw createError({
      statusCode: 404,
      message: 'Page not found',
    });
  }

  // Fetch legal page
  const page = await queryCollection(event, 'legal').path(`/legal/${slug}`).first();

  if (!page) {
    throw createError({
      statusCode: 404,
      message: 'Page not found',
    });
  }

  return page;
});
