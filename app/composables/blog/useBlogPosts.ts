import type { BlogCollectionItem } from '@nuxt/content';

interface BlogPost extends Omit<BlogCollectionItem, 'authors'> {
  authors?: { name: string; avatar?: { src: string } }[];
}

interface TagCount {
  name: string;
  count: number;
}

export async function useBlogPosts(options: { limit?: number } = {}) {
  const { limit = 12 } = options;

  const route = useRoute();
  const router = useRouter();
  const { isAdmin } = useRole();

  const currentPage = ref(Number.parseInt((route.query.page as string) || '1'));
  const selectedTag = ref((route.query.tag as string) || '');

  const { data: postsData, refresh } = await useFetch<{
    posts: BlogCollectionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>('/api/blog/posts', {
    query: computed(() => ({
      page: currentPage.value,
      limit,
      tag: selectedTag.value || undefined,
      includeDrafts: isAdmin.value,
    })),
    watch: false,
  });

  const posts = computed<BlogPost[]>(() => {
    const rawPosts = postsData.value?.posts || [];
    return rawPosts.map(post => ({
      ...post,
      authors: post.authors?.map(a => ({
        ...a,
        avatar: a.avatar ? { src: a.avatar } : undefined,
      })),
    }));
  });

  const total = computed(() => postsData.value?.total || 0);
  const totalPages = computed(() => postsData.value?.totalPages || 1);

  const allTags = computed<TagCount[]>(() => {
    if (!posts.value.length)
      return [];

    const tagCounts = new Map<string, number>();
    for (const post of posts.value) {
      if (post.tags && Array.isArray(post.tags)) {
        for (const tag of post.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  function filterByTag(tag: string) {
    if (selectedTag.value === tag || tag === '') {
      selectedTag.value = '';
      void router.push({ query: { page: '1' } });
    }
    else {
      selectedTag.value = tag;
      currentPage.value = 1;
      void router.push({ query: { tag, page: '1' } });
    }
    void refresh();
  }

  // Sync page changes to URL
  watch(currentPage, (newPage) => {
    const query: Record<string, string> = { page: newPage.toString() };
    if (selectedTag.value) {
      query.tag = selectedTag.value;
    }
    void router.push({ query });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void refresh();
  });

  // Scroll on tag change
  watch(selectedTag, () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Sync route query to state
  watch(
    () => route.query,
    (newQuery) => {
      currentPage.value = Number.parseInt((newQuery.page as string) || '1');
      selectedTag.value = (newQuery.tag as string) || '';
      void refresh();
    },
  );

  return {
    posts,
    total,
    totalPages,
    currentPage,
    selectedTag,
    allTags,
    limit,
    filterByTag,
  };
}
