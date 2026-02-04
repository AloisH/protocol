/**
 * Track recent command palette selections
 * Persists to localStorage, max 5 items
 */

export interface RecentItem {
  id: string;
  label: string;
  icon?: string;
}

const STORAGE_KEY = 'bistro:recent-commands';
const MAX_ITEMS = 5;

export function useRecentItems() {
  const recentItems = useState<RecentItem[]>('recent-items', () => []);

  // Load from localStorage on client
  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        recentItems.value = JSON.parse(stored) as RecentItem[];
      }
    }
    catch {
      // Ignore parse errors
    }
  });

  function addRecentItem(item: RecentItem) {
    // Remove if exists
    const filtered = recentItems.value.filter(i => i.id !== item.id);
    // Add to front
    recentItems.value = [item, ...filtered].slice(0, MAX_ITEMS);
    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentItems.value));
    }
    catch {
      // Ignore storage errors
    }
  }

  function clearRecentItems() {
    recentItems.value = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    }
    catch {
      // Ignore storage errors
    }
  }

  return {
    recentItems: readonly(recentItems),
    addRecentItem,
    clearRecentItems,
  };
}
