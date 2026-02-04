import { describe, expect, it, vi } from 'vitest';
import { ref, watch } from 'vue';

// Stub Vue auto-imports
vi.stubGlobal('ref', ref);
vi.stubGlobal('watch', watch);

// Import after mocks
const { useSlugify } = await import('./useSlugify');

describe('useSlugify', () => {
  describe('slugify function', () => {
    it('converts to lowercase', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify('hello world')).toBe('hello-world');
    });

    it('removes special characters', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify('hello@world!')).toBe('helloworld');
      expect(slugify('test#$%^&*()')).toBe('test');
    });

    it('collapses multiple hyphens', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify('hello   world')).toBe('hello-world');
      expect(slugify('a--b--c')).toBe('a-b-c');
    });

    it('removes leading/trailing hyphens', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify(' hello world ')).toBe('hello-world');
      expect(slugify('---hello---')).toBe('hello');
    });

    it('handles underscores', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify('hello_world')).toBe('hello-world');
    });

    it('handles empty string', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify('')).toBe('');
    });

    it('handles only special characters', () => {
      const source = ref('');
      const target = ref('');
      const { slugify } = useSlugify(source, target);

      expect(slugify('!@#$%')).toBe('');
    });
  });

  describe('watch behavior', () => {
    it('auto-updates target when empty', async () => {
      const source = ref('');
      const target = ref('');
      useSlugify(source, target);

      source.value = 'My Company';
      await Promise.resolve(); // flush watch

      expect(target.value).toBe('my-company');
    });

    it('auto-updates target when matches previous slug', async () => {
      const source = ref('Hello');
      const target = ref('hello');
      useSlugify(source, target);

      source.value = 'Hello World';
      await Promise.resolve();

      expect(target.value).toBe('hello-world');
    });

    it('does not update target if manually changed', async () => {
      const source = ref('Hello');
      const target = ref('custom-slug');
      useSlugify(source, target);

      source.value = 'Hello World';
      await Promise.resolve();

      expect(target.value).toBe('custom-slug');
    });
  });
});
