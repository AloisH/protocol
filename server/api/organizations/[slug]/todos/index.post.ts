import { createTodoSchema } from '#shared/todo';
import { todoService } from '../../../../features/todo/todo-service';
import { requireOrgAccess } from '../../../../utils/require-org-access';

defineRouteMeta({
  openAPI: {
    tags: ['Todos'],
    description: 'Create a new todo for organization',
    parameters: [{ in: 'path', name: 'slug', required: true, description: 'Organization slug' }],
  },
});

export default defineEventHandler(async (event) => {
  const ctx = await requireOrgAccess(event);
  const body: unknown = await readBody(event);
  const input = createTodoSchema.parse(body);

  const todo = await todoService.createTodo(ctx.organizationId, ctx.userId, input);
  return { todo };
});
