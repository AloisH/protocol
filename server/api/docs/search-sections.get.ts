import { queryCollectionSearchSections } from '@nuxt/content/server';

export default defineEventHandler(async (event) => {
  const sections = await queryCollectionSearchSections(event, 'docs', {
    ignoredTags: ['pre', 'code'],
  });

  // Transform to expected format with /docs prefix
  return sections.map(s => ({
    title: s.title,
    content: s.content,
    headings: s.titles,
    path: s.id.startsWith('/docs') ? s.id : `/docs${s.id}`,
  }));
});
