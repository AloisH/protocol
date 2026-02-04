/**
 * Centralized SEO composable for consistent meta tag handling
 */
export interface SeoOptions {
  /** Page title - " - Bistro" appended if not present */
  title: string;
  /** Page description for meta and OG tags */
  description: string;
  /** OG image URL (defaults to /og-image.png) */
  image?: string;
  /** Page type for og:type */
  type?: 'website' | 'article';
  /** Article publish date (ISO string) */
  publishedTime?: string;
  /** Article tags */
  tags?: string[];
  /** Whether to skip canonical URL (e.g., for dynamic pages) */
  noCanonical?: boolean;
  /** Article author name */
  authorName?: string;
}

export function useSeo(options: SeoOptions) {
  const route = useRoute();
  const config = useRuntimeConfig();
  const siteUrl = config.public.appUrl || 'http://localhost:3000';

  // Auto-append " - Bistro" if not present
  const fullTitle = options.title.includes('Bistro') ? options.title : `${options.title} - Bistro`;

  // Use provided image or let nuxt-og-image generate dynamically
  const hasCustomImage = !!options.image;
  const absoluteImage = hasCustomImage
    ? options.image!.startsWith('http')
      ? options.image!
      : `${siteUrl}${options.image}`
    : undefined;

  useSeoMeta({
    title: fullTitle,
    description: options.description,
    ogTitle: fullTitle,
    ogDescription: options.description,
    ogType: options.type || 'website',
    twitterCard: 'summary_large_image',
    ...(absoluteImage && { ogImage: absoluteImage, twitterImage: absoluteImage }),
    ...(options.publishedTime && { articlePublishedTime: options.publishedTime }),
    ...(options.tags?.length && { articleTag: options.tags }),
  });

  // Generate dynamic OG image if no custom image provided (server only)
  if (!hasCustomImage && import.meta.server) {
    defineOgImageComponent('NuxtSeo', {
      title: options.title,
      description: options.description,
    });
  }

  // Build head arrays
  const links: { rel: string; href: string }[] = [];
  const scripts: { type: string; innerHTML: string }[] = [];

  // Add canonical URL unless explicitly skipped
  if (!options.noCanonical) {
    links.push({ rel: 'canonical', href: `${siteUrl}${route.path}` });
  }

  // Add JSON-LD for articles (BlogPosting schema)
  if (options.type === 'article' && options.publishedTime) {
    // For JSON-LD, use custom image or the dynamic OG image URL
    const schemaImage = absoluteImage || `${siteUrl}/__og-image__/image${route.path}/og.png`;

    const blogPostingSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': options.title,
      'description': options.description,
      'image': schemaImage,
      'datePublished': options.publishedTime,
      'url': `${siteUrl}${route.path}`,
      ...(options.authorName && {
        author: {
          '@type': 'Person',
          'name': options.authorName,
        },
      }),
      'publisher': {
        '@type': 'Organization',
        'name': 'Bistro',
        'url': siteUrl,
      },
    };

    scripts.push({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(blogPostingSchema),
    });
  }

  useHead({
    link: links,
    script: scripts,
  });
}
