import { describe, expect, it } from 'vitest';
import { isPublicRoute } from './route';

describe('isPublicRoute', () => {
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/blog/*', '/docs/*'];

  describe('exact route matching', () => {
    it('matches exact public routes', () => {
      expect(isPublicRoute('/', publicRoutes)).toBe(true);
      expect(isPublicRoute('/auth/login', publicRoutes)).toBe(true);
      expect(isPublicRoute('/auth/register', publicRoutes)).toBe(true);
    });

    it('rejects non-public routes', () => {
      expect(isPublicRoute('/dashboard', publicRoutes)).toBe(false);
      expect(isPublicRoute('/profile', publicRoutes)).toBe(false);
      expect(isPublicRoute('/org/my-org/dashboard', publicRoutes)).toBe(false);
    });
  });

  describe('wildcard route matching', () => {
    it('matches wildcard base path', () => {
      expect(isPublicRoute('/blog', publicRoutes)).toBe(true);
      expect(isPublicRoute('/docs', publicRoutes)).toBe(true);
    });

    it('matches wildcard nested paths', () => {
      expect(isPublicRoute('/blog/post-1', publicRoutes)).toBe(true);
      expect(isPublicRoute('/blog/post-1/comments', publicRoutes)).toBe(true);
      expect(isPublicRoute('/docs/getting-started', publicRoutes)).toBe(true);
      expect(isPublicRoute('/docs/api/reference', publicRoutes)).toBe(true);
    });

    it('rejects similar but non-matching paths', () => {
      expect(isPublicRoute('/blogs', publicRoutes)).toBe(false);
      expect(isPublicRoute('/blogpost', publicRoutes)).toBe(false);
      expect(isPublicRoute('/documentation', publicRoutes)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles empty public routes array', () => {
      expect(isPublicRoute('/', [])).toBe(false);
      expect(isPublicRoute('/any-route', [])).toBe(false);
    });

    it('handles paths with trailing slashes', () => {
      expect(isPublicRoute('/auth/login/', publicRoutes)).toBe(false);
      expect(isPublicRoute('/blog/', publicRoutes)).toBe(true);
    });

    it('handles query strings and hashes', () => {
      expect(isPublicRoute('/auth/login?redirect=/dashboard', publicRoutes)).toBe(false);
      expect(isPublicRoute('/#home', publicRoutes)).toBe(false);
    });
  });
});
