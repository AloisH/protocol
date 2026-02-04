import { updateTodoSchema } from '#shared/todo';
import { todoService } from '../../../../features/todo/todo-service';
import { requireOrgAccess } from '../../../../utils/require-org-access';

defineRouteMeta({
  openAPI: {
    tags: ['Todos'],
    description: 'Update a todo',
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
  const input = updateTodoSchema.parse(body);

  const todo = await todoService.updateTodo(todoId, ctx.organizationId, input);
  return { todo };
});
