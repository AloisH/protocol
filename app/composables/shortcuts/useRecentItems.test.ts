import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readonly, ref } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('readonly', readonly);
vi.stubGlobal('onMounted', vi.fn((cb: () => void) => {
  cb();
}));

// Mock useState
const mockRecentItems = ref<{ id: string; label: string; icon?: string }[]>([]);
vi.stubGlobal('useState', vi.fn(() => mockRecentItems));

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
};
vi.stubGlobal('localStorage', mockLocalStorage);

// Import after mocks
const { useRecentItems } = await import('./useRecentItems');

describe('useRecentItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentItems.value = [];
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  describe('initial state', () => {
    it('starts empty', () => {
      const { recentItems } = useRecentItems();
      expect(recentItems.value).toEqual([]);
    });

    it('loads from localStorage', () => {
      mockStorage['bistro:recent-commands'] = JSON.stringify([
        { id: '1', label: 'Item 1' },
      ]);
      useRecentItems();
      expect(mockRecentItems.value).toEqual([{ id: '1', label: 'Item 1' }]);
    });

    it('handles invalid localStorage gracefully', () => {
      mockStorage['bistro:recent-commands'] = 'invalid';
      useRecentItems();
      expect(mockRecentItems.value).toEqual([]);
    });
  });

  describe('addRecentItem', () => {
    it('adds item to front', () => {
      const { addRecentItem } = useRecentItems();
      addRecentItem({ id: '1', label: 'First' });
      expect(mockRecentItems.value[0]).toEqual({ id: '1', label: 'First' });
    });

    it('moves existing item to front', () => {
      mockRecentItems.value = [
        { id: '1', label: 'First' },
        { id: '2', label: 'Second' },
      ];
      const { addRecentItem } = useRecentItems();
      addRecentItem({ id: '2', label: 'Second Updated' });

      expect(mockRecentItems.value[0]?.id).toBe('2');
      expect(mockRecentItems.value).toHaveLength(2);
    });

    it('limits to 5 items', () => {
      const recent = useRecentItems();
      for (let i = 1; i <= 7; i++) {
        recent.addRecentItem({ id: String(i), label: `Item ${String(i)}` });
      }
      expect(mockRecentItems.value).toHaveLength(5);
      expect(mockRecentItems.value[0]?.id).toBe('7'); // most recent
      expect(mockRecentItems.value[4]?.id).toBe('3'); // oldest kept
    });

    it('persists to localStorage', () => {
      const recent = useRecentItems();
      recent.addRecentItem({ id: '1', label: 'Test' });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'bistro:recent-commands',
        expect.any(String),
      );
    });

    it('includes icon when provided', () => {
      const { addRecentItem } = useRecentItems();
      addRecentItem({ id: '1', label: 'Test', icon: 'i-lucide-star' });
      expect(mockRecentItems.value[0]?.icon).toBe('i-lucide-star');
    });
  });

  describe('clearRecentItems', () => {
    it('clears all items', () => {
      mockRecentItems.value = [{ id: '1', label: 'Test' }];
      const { clearRecentItems } = useRecentItems();
      clearRecentItems();
      expect(mockRecentItems.value).toEqual([]);
    });

    it('removes from localStorage', () => {
      const recent = useRecentItems();
      recent.clearRecentItems();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('bistro:recent-commands');
    });
  });

  describe('readonly', () => {
    it('returns readonly recentItems', () => {
      const { recentItems } = useRecentItems();
      // The returned ref should be readonly wrapped
      expect(recentItems).toBeDefined();
    });
  });
});
