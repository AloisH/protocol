/**
 * Check if path matches public route pattern (supports wildcards)
 * @param path - The route path to check
 * @param publicRoutes - Array of public route patterns (supports /* wildcards)
 * @returns true if path matches any public route pattern
 */
export function isPublicRoute(path: string, publicRoutes: string[]): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith('/*')) {
      const basePath = route.slice(0, -2);
      return path === basePath || path.startsWith(`${basePath}/`);
    }
    return path === route;
  });
}
