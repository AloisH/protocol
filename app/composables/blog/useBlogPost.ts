import type { BlogCollectionItem } from '@nuxt/content';

export async function useBlogPost(slug: string) {
  const { isAdmin } = useRole();

  // Fetch post with async data for proper SSR
  const { data: post, error } = await useAsyncData<BlogCollectionItem>(`blog-post-${slug}`, async () =>
    $fetch(`/api/blog/posts/${slug}`, {
      query: { includeDrafts: isAdmin.value },
    }));

  return {
    post,
    error,
    isAdmin,
  };
}
