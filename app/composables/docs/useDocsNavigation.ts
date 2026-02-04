import type { NavigationMenuItem } from '@nuxt/ui';

interface NavItem {
  path: string;
  title: string;
  stem: string;
  order?: number;
  page?: boolean;
  children?: NavItem[];
}

export function useDocsNavigation() {
  const { data, status, error } = useFetch<NavItem[]>('/api/docs/navigation', {
    key: 'docs-navigation',
  });

  const navItems = computed<NavigationMenuItem[][]>(() => {
    if (!data.value || !data.value[0]?.children)
      return [];

    // Icon defaults per section
    const iconMap: Record<string, string> = {
      'getting-started': 'i-lucide-rocket',
      'features': 'i-lucide-star',
      'deployment': 'i-lucide-cloud',
    };

    // Root is at index 0, we want its children (sections)
    const sections = data.value[0].children
      .filter(item => item.page === false) // Only sections, not pages
      .map((section) => {
        const sectionName = section.stem.split('/')[1] ?? 'default';
        const icon = iconMap[sectionName] || 'i-lucide-file';

        return {
          label: section.title,
          icon,
          children: section.children
            ?.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map(child => ({
              label: child.title,
              to: child.path,
            })),
        };
      });

    return [sections];
  });

  return { navigation: navItems, status, error };
}
