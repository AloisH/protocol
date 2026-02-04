import { queryCollection } from '@nuxt/content/server';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export default defineEventHandler(async (event): Promise<SitemapUrl[]> => {
  const urls: SitemapUrl[] = [];

  // Static pages
  urls.push(
    { loc: '/', changefreq: 'weekly', priority: 1.0 },
    { loc: '/blog', changefreq: 'daily', priority: 0.8 },
    { loc: '/docs', changefreq: 'weekly', priority: 0.8 },
    { loc: '/changelog', changefreq: 'weekly', priority: 0.6 },
    { loc: '/contact', changefreq: 'monthly', priority: 0.5 },
    { loc: '/legal/privacy', changefreq: 'monthly', priority: 0.3 },
    { loc: '/legal/terms', changefreq: 'monthly', priority: 0.3 },
  );

  // Blog posts (exclude drafts)
  try {
    const blogPosts = (await queryCollection(event, 'blog').all());
    for (const post of blogPosts) {
      if (!post.draft && post.path) {
        urls.push({
          loc: post.path,
          lastmod: post.date,
          changefreq: 'monthly',
          priority: 0.7,
        });
      }
    }
  }
  catch {
    // Content collection may not exist
  }

  // Docs pages
  try {
    const docPages = await queryCollection(event, 'docs').all();
    for (const doc of docPages) {
      if (doc.path) {
        urls.push({
          loc: doc.path,
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    }
  }
  catch {
    // Content collection may not exist
  }

  return urls;
});
