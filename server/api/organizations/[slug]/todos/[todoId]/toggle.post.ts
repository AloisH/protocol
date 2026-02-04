import { toggleTodoSchema } from '#shared/todo';
import { todoService } from '../../../../../features/todo/todo-service';
import { requireOrgAccess } from '../../../../../utils/require-org-access';

defineRouteMeta({
  openAPI: {
    tags: ['Todos'],
    description: 'Toggle todo completion status',
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

  const body: unknown = await readBody(event);
  const { completed } = toggleTodoSchema.parse(body);

  const todo = await todoService.toggleTodo(todoId, ctx.organizationId, completed);
  return { todo };
});
