import type { BlogCollectionItem } from '@nuxt/content';
import { queryCollection } from '@nuxt/content/server';
import { requireRole } from '../../utils/require-role';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = Number.parseInt(query.page as string) || 1;
  const limit = Number.parseInt(query.limit as string) || 12;
  const tag = query.tag as string;
  const includeDrafts = query.includeDrafts === 'true';

  // Check if user is admin (for draft posts)
  let isAdmin = false;
  try {
    const session = await requireRole(event, ['ADMIN', 'SUPER_ADMIN']);
    isAdmin = !!session;
  }
  catch {
    // Not admin, continue without drafts
  }

  // Fetch all posts
  const allPosts = (await queryCollection(event, 'blog').all());

  // Filter drafts and tags in memory
  const filteredPosts = allPosts
    .filter((post: BlogCollectionItem) => {
      // Check draft status
      if (post.draft && (!includeDrafts || !isAdmin)) {
        return false;
      }

      // Check tag filter
      if (tag && (!post.tags || !post.tags.includes(tag))) {
        return false;
      }

      return true;
    })
    .reverse(); // Reverse for descending order
  const total = filteredPosts.length;

  // Apply pagination in memory
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const posts = filteredPosts.slice(startIndex, endIndex);

  return {
    posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
});
