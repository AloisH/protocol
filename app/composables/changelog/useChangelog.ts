export interface ChangelogChange {
  type: 'feature' | 'fix' | 'improvement';
  description: string;
}

export interface ChangelogEntry {
  path: string;
  title: string;
  description: string;
  date: string;
  version: string;
  type: 'major' | 'minor' | 'patch';
  changes: ChangelogChange[];
}

interface ChangelogResponse {
  entries: ChangelogEntry[];
  total: number;
}

export const changeTypes = [
  { value: 'feature', label: 'Features', icon: 'i-lucide-sparkles' },
  { value: 'fix', label: 'Fixes', icon: 'i-lucide-bug' },
  { value: 'improvement', label: 'Improvements', icon: 'i-lucide-trending-up' },
] as const;

export function useChangelog() {
  const route = useRoute();
  const router = useRouter();

  const selectedType = ref((route.query.type as string) || '');

  // Fetch all entries (unfiltered) for counts
  const { data: allData } = useFetch<ChangelogResponse>('/api/changelog', {
    key: 'changelog-all',
  });
  const allEntries = computed(() => allData.value?.entries || []);

  // Fetch filtered entries
  const { data, refresh } = useFetch<ChangelogResponse>('/api/changelog', {
    key: 'changelog-filtered',
    query: computed(() => ({
      type: selectedType.value || undefined,
    })),
    watch: false,
  });

  const entries = computed(() => data.value?.entries || []);

  // Filter actions
  function filterByType(type: string) {
    selectedType.value = type;
    if (type) {
      void router.push({ query: { type } });
    }
    else {
      void router.push({ query: {} });
    }
    void refresh();
  }

  function countByType(type: string): number {
    return allEntries.value.filter(entry => entry.changes.some(c => c.type === type)).length;
  }

  // Color/icon helpers
  function getVersionColor(type: string): 'error' | 'primary' | 'neutral' {
    switch (type) {
      case 'major':
        return 'error';
      case 'minor':
        return 'primary';
      default:
        return 'neutral';
    }
  }

  function getChangeIcon(type: string): string {
    switch (type) {
      case 'feature':
        return 'i-lucide-sparkles';
      case 'fix':
        return 'i-lucide-bug';
      case 'improvement':
        return 'i-lucide-trending-up';
      default:
        return 'i-lucide-circle';
    }
  }

  function getChangeColor(type: string): string {
    switch (type) {
      case 'feature':
        return 'text-primary';
      case 'fix':
        return 'text-red-500';
      case 'improvement':
        return 'text-green-500';
      default:
        return 'text-neutral-400';
    }
  }

  // Watch route changes
  watch(
    () => route.query.type,
    (newType) => {
      selectedType.value = (newType as string) || '';
      void refresh();
    },
  );

  return {
    // State
    selectedType,
    entries,
    allEntries,
    // Actions
    filterByType,
    countByType,
    // Helpers
    getVersionColor,
    getChangeIcon,
    getChangeColor,
  };
}
