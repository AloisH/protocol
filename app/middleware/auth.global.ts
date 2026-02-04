import { isPublicRoute } from '../utils/route';

export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes centralized in nuxt.config.ts
  const config = useRuntimeConfig();
  const publicRoutes = config.public.publicRoutes;

  // Allow access to public routes (with wildcard support)
  if (isPublicRoute(to.path, publicRoutes)) {
    return;
  }

  // Check if user is authenticated
  const { session, fetchSession } = useAuth();
  await fetchSession();

  // Redirect to login if not authenticated
  if (!session.value) {
    return navigateTo({ name: 'auth-login' });
  }
});
