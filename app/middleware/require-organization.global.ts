import { isPublicRoute } from '../utils/route';

/**
 * Global middleware to ensure user has selected/created an organization
 * Runs after auth.global.ts and onboarding.global.ts
 * Organization creation is now part of onboarding flow
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useAuth();

  // Skip if not logged in (auth middleware handles this)
  if (!loggedIn.value) {
    return;
  }

  // Skip if user hasn't completed onboarding (onboarding middleware handles this)
  if (user.value && 'onboardingCompleted' in user.value && !user.value.onboardingCompleted) {
    return;
  }

  // Skip if on onboarding page
  if (to.path === '/onboarding') {
    return;
  }

  // Skip if already on organization-related pages
  const orgPages = ['/org/create', '/org/select', '/org/invite'];
  if (orgPages.some(page => to.path.startsWith(page))) {
    return;
  }

  // Skip if already on an org-scoped page (/org/[slug]/...)
  if (to.path.startsWith('/org/')) {
    return;
  }

  // Skip if on auth pages
  if (to.path.startsWith('/auth/')) {
    return;
  }

  // Skip if on user settings pages
  if (to.path.startsWith('/user/')) {
    return;
  }

  // Skip user-level pages (profile, admin)
  if (to.path.startsWith('/profile') || to.path.startsWith('/admin')) {
    return;
  }

  // Skip public routes (blog, legal, docs, etc)
  const config = useRuntimeConfig();
  const publicRoutes = config.public.publicRoutes;
  if (isPublicRoute(to.path, publicRoutes)) {
    return;
  }

  // Use composable state (cached) instead of re-fetching
  const { organizations, fetchOrganizations } = useOrganization();

  // Fetch if not already loaded
  if (organizations.value.length === 0) {
    await fetchOrganizations();
  }

  // Redirect to org select (will show create prompt if no orgs)
  return navigateTo('/org/select');
});
