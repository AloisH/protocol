import { z } from 'zod';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  TITLE_MIN_LENGTH,
  TODO_FILTERS,
  TODO_SORT_OPTIONS,
} from './constants';

/**
 * Todo validation schemas
 */

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(TITLE_MIN_LENGTH, 'Title is required')
    .max(MAX_TITLE_LENGTH, `Title must be less than ${MAX_TITLE_LENGTH} characters`),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`,
    )
    .optional(),
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(TITLE_MIN_LENGTH, 'Title is required')
    .max(MAX_TITLE_LENGTH, `Title must be less than ${MAX_TITLE_LENGTH} characters`)
    .optional(),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`,
    )
    .optional(),
  completed: z.boolean().optional(),
});

export const toggleTodoSchema = z.object({
  completed: z.boolean(),
});

export const todoQuerySchema = z.object({
  filter: z.enum(TODO_FILTERS).default('all'),
  sort: z.enum(TODO_SORT_OPTIONS).default('date'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type ToggleTodoInput = z.infer<typeof toggleTodoSchema>;
export type TodoQueryInput = z.infer<typeof todoQuerySchema>;

/**
 * Todo entity schema (matches Prisma model)
 */
export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  organizationId: z.string(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Todo = z.infer<typeof todoSchema>;

/**
 * API response schemas
 */
export const todoResponseSchema = z.object({
  todo: todoSchema,
});

export type TodoResponse = z.infer<typeof todoResponseSchema>;

export const todoListResponseSchema = z.object({
  todos: z.array(todoSchema),
  total: z.number().int().min(0),
});

export type TodoListResponse = z.infer<typeof todoListResponseSchema>;
