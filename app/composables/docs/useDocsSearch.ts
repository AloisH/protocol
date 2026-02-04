import Fuse from 'fuse.js';

interface SearchSection {
  title: string;
  content: string;
  path: string;
  headings?: string[];
}

export function useDocsSearch() {
  const query = ref('');
  const isOpen = ref(false);

  const { data: sections } = useFetch<SearchSection[]>('/api/docs/search-sections', {
    key: 'docs-search-sections',
    lazy: true,
  });

  const fuse = computed(() => {
    if (!sections.value)
      return null;

    return new Fuse(sections.value, {
      keys: [
        { name: 'title', weight: 2 },
        { name: 'content', weight: 1 },
        { name: 'headings', weight: 1.5 },
      ],
      threshold: 0.4,
      minMatchCharLength: 2,
    });
  });

  const results = computed(() => {
    if (!query.value || !fuse.value)
      return [];

    return fuse.value
      .search(query.value)
      .slice(0, 10)
      .map(r => ({
        title: r.item.title,
        path: r.item.path,
        content: r.item.content.slice(0, 150),
      }));
  });

  function open() {
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
    query.value = '';
  }

  return { query, results, isOpen, open, close };
}
