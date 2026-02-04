# Todo Feature

Todo CRUD functionality with filter/sort and URL persistence.

## Components

- `TodoList.vue` - Display todos with filter/sort controls, loading/empty states
- `TodoCreateForm.vue` - Input form for creating new todos

## Composable

- `composables/todo/useTodos.ts` - Todo state management
  - `todos`, `loading`, `filter`, `sort` - Reactive state
  - `fetchTodos()` - Load todos from API
  - `createTodo(input)` - Create new todo
  - `toggleTodo(id, completed)` - Toggle completion status
  - `deleteTodo(id)` - Delete todo
  - `setFilter('all' | 'active' | 'completed')` - Filter todos
  - `setSort('date' | 'title')` - Sort todos

## Dependencies

- Server: `/api/todos` endpoints
- Schema: `#shared/todo` (CreateTodoInput)
- Composables: Auto-imported (useToast, useRoute, useRouter)

## Usage

```vue
<script setup lang="ts">
const { todos, loading, fetchTodos, createTodo } = useTodos();

onMounted(() => fetchTodos());

const newTodo = { title: 'Task', description: 'Description' };
await createTodo(newTodo);
</script>

<template>
  <TodoList />
</template>
```

**Features:**

- URL-synced filter/sort (`?filter=active&sort=title`)
- Optimistic UI updates
- Toast notifications for errors
- Auto-imports (no import needed)

See: [app/CLAUDE.md](../../CLAUDE.md) for composables pattern
