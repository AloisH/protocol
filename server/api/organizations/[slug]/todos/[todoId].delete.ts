import { todoService } from '../../../../features/todo/todo-service';
import { requireOrgAccess } from '../../../../utils/require-org-access';

defineRouteMeta({
  openAPI: {
    tags: ['Todos'],
    description: 'Delete a todo',
    parameters: [
      { in: 'path', name: 'slug', required: true, description: 'Organization slug' },
      { in: 'path', name: 'todoId', required: true, description: 'Todo ID' },
    ],
  },
});

export default defineEventHandler(async (event) => {
  const ctx = await requireOrgAccess(event);
  const todoId = getRouterParam(event, 'todoId');
  if (!todoId) {
    throw createError({ statusCode: 400, message: 'Todo ID required' });
  }

  await todoService.deleteTodo(todoId, ctx.organizationId);
  return { success: true };
});
