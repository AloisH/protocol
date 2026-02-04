import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('computed', computed);

// Mock useFetch
const mockSections = ref<{ title: string; content: string; path: string; headings?: string[] }[] | null>(null);
vi.stubGlobal('useFetch', vi.fn(() => ({ data: mockSections })));

// Import after mocks
const { useDocsSearch } = await import('./useDocsSearch');

describe('useDocsSearch', () => {
  beforeEach(() => {
    mockSections.value = null;
  });

  describe('initial state', () => {
    it('starts with empty query', () => {
      const { query } = useDocsSearch();
      expect(query.value).toBe('');
    });

    it('starts closed', () => {
      const { isOpen } = useDocsSearch();
      expect(isOpen.value).toBe(false);
    });

    it('starts with empty results', () => {
      const { results } = useDocsSearch();
      expect(results.value).toEqual([]);
    });
  });

  describe('open/close', () => {
    it('open sets isOpen to true', () => {
      const { isOpen, open } = useDocsSearch();
      open();
      expect(isOpen.value).toBe(true);
    });

    it('close sets isOpen to false and clears query', () => {
      const { isOpen, query, open, close } = useDocsSearch();
      open();
      query.value = 'test';
      close();
      expect(isOpen.value).toBe(false);
      expect(query.value).toBe('');
    });
  });

  describe('search results', () => {
    it('returns empty when no sections', () => {
      const { query, results } = useDocsSearch();
      query.value = 'test';
      expect(results.value).toEqual([]);
    });

    it('returns empty when query is empty', () => {
      mockSections.value = [
        { title: 'Getting Started', content: 'Welcome to the docs', path: '/docs/intro' },
      ];
      const { results } = useDocsSearch();
      expect(results.value).toEqual([]);
    });

    it('finds matching sections by title', () => {
      mockSections.value = [
        { title: 'Getting Started', content: 'Welcome', path: '/docs/intro' },
        { title: 'Installation', content: 'How to install', path: '/docs/install' },
        { title: 'API Reference', content: 'API docs', path: '/docs/api' },
      ];

      const { query, results } = useDocsSearch();
      query.value = 'install';

      expect(results.value.length).toBeGreaterThan(0);
      expect(results.value[0]?.title).toBe('Installation');
    });

    it('finds matching sections by content', () => {
      mockSections.value = [
        { title: 'Intro', content: 'Welcome to getting started', path: '/docs/intro' },
        { title: 'Config', content: 'Configuration options', path: '/docs/config' },
      ];

      const { query, results } = useDocsSearch();
      query.value = 'welcome';

      expect(results.value.length).toBeGreaterThan(0);
      expect(results.value[0]?.path).toBe('/docs/intro');
    });

    it('limits results to 10', () => {
      mockSections.value = Array.from({ length: 20 }, (_, i) => ({
        title: `Doc ${String(i)}`,
        content: 'test content',
        path: `/docs/${String(i)}`,
      }));

      const { query, results } = useDocsSearch();
      query.value = 'test';

      expect(results.value.length).toBeLessThanOrEqual(10);
    });

    it('truncates content in results', () => {
      mockSections.value = [
        {
          title: 'Long Doc',
          content: 'a'.repeat(500),
          path: '/docs/long',
        },
      ];

      const { query, results } = useDocsSearch();
      query.value = 'long';

      expect(results.value[0]?.content.length).toBeLessThanOrEqual(150);
    });

    it('returns title and path in results', () => {
      mockSections.value = [
        { title: 'Test Doc', content: 'Test content here', path: '/docs/test' },
      ];

      const { query, results } = useDocsSearch();
      query.value = 'test';

      expect(results.value[0]).toMatchObject({
        title: 'Test Doc',
        path: '/docs/test',
      });
    });
  });
});
