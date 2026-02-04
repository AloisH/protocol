import { todoQuerySchema } from '#shared/todo';
import { todoService } from '../../../../features/todo/todo-service';
import { requireOrgAccess } from '../../../../utils/require-org-access';

defineRouteMeta({
  openAPI: {
    tags: ['Todos'],
    description: 'List todos for organization',
    parameters: [
      { in: 'path', name: 'slug', required: true, description: 'Organization slug' },
      { in: 'query', name: 'filter', description: 'Filter: all, active, completed' },
      { in: 'query', name: 'sort', description: 'Sort: date, title' },
      { in: 'query', name: 'page', description: 'Page number' },
      { in: 'query', name: 'limit', description: 'Items per page' },
    ],
  },
});

export default defineEventHandler(async (event) => {
  const ctx = await requireOrgAccess(event);
  const query = getQuery(event);
  const { filter, sort, page, limit } = todoQuerySchema.parse(query);

  return todoService.listTodos(ctx.organizationId, { filter, sort, page, limit });
});
