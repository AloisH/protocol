import { queryCollectionNavigation } from '@nuxt/content/server';

interface NavItem {
  title: string;
  path: string;
  stem: string;
  order?: number;
  page?: boolean;
  children?: NavItem[];
}

export default defineEventHandler(async (event): Promise<NavItem[]> => {
  const navigation = await queryCollectionNavigation(event, 'docs');
  return navigation as NavItem[];
});
