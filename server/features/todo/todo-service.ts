import type { CreateTodoInput, TodoQueryInput, UpdateTodoInput } from '#shared/todo';
import type { Todo } from '../../../prisma/generated/client';
import { todoRepository } from './todo-repository';

export class TodoService {
  async listTodos(
    organizationId: string,
    options?: Partial<TodoQueryInput>,
  ): Promise<{ todos: Todo[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 10 } = options || {};
    const { todos, total } = await todoRepository.findByOrganizationId(organizationId, options);
    return {
      todos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTodo(id: string, organizationId: string): Promise<Todo> {
    const todo = await todoRepository.findById(id, organizationId);
    if (!todo) {
      throw createError({
        statusCode: 404,
        message: 'Todo not found',
      });
    }
    return todo;
  }

  async createTodo(organizationId: string, createdBy: string, input: CreateTodoInput): Promise<Todo> {
    return todoRepository.create(organizationId, createdBy, input);
  }

  async updateTodo(id: string, organizationId: string, input: UpdateTodoInput): Promise<Todo> {
    await this.getTodo(id, organizationId);
    return todoRepository.update(id, organizationId, input);
  }

  async deleteTodo(id: string, organizationId: string): Promise<void> {
    await this.getTodo(id, organizationId);
    await todoRepository.delete(id);
  }

  async toggleTodo(id: string, organizationId: string, completed: boolean): Promise<Todo> {
    await this.getTodo(id, organizationId);
    return todoRepository.update(id, organizationId, { completed });
  }
}

export const todoService = new TodoService();
