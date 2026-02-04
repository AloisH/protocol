<script setup lang="ts">
const {
  todos,
  loading,
  filter,
  sort,
  page,
  total,
  totalPages,
  setFilter,
  setSort,
  setPage,
  toggleTodo,
  deleteTodo,
} = useTodos();

// Status message for screen readers
const statusMessage = computed(() => {
  if (loading.value)
    return 'Loading todos...';
  if (todos.value.length === 0)
    return 'No todos found.';
  const completed = todos.value.filter(t => t.completed).length;
  return `${todos.value.length} todos, ${completed} completed.`;
});

async function handleToggle(id: string, completed: string | boolean) {
  await toggleTodo(id, Boolean(completed));
}

async function handleDelete(id: string) {
  await deleteTodo(id);
}

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)
    return 'Just now';
  if (diffMins < 60)
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1)
    return 'Yesterday';
  if (diffDays < 7)
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return new Date(date).toLocaleDateString();
}
</script>

<template>
  <div class="space-y-6">
    <!-- Screen reader announcements -->
    <div
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
    >
      {{ statusMessage }}
    </div>

    <!-- Create form -->
    <TodoCreateForm />

    <!-- Filter and Sort Controls -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <!-- Filter tabs -->
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-filter"
          class="text-neutral-400"
        />
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filter:</span>
        <div class="flex gap-2">
          <UBadge
            variant="subtle"
            :color="filter === 'all' ? 'primary' : 'neutral'"
            class="cursor-pointer"
            @click="setFilter('all')"
          >
            All
          </UBadge>
          <UBadge
            variant="subtle"
            :color="filter === 'active' ? 'primary' : 'neutral'"
            class="cursor-pointer"
            @click="setFilter('active')"
          >
            Active
          </UBadge>
          <UBadge
            variant="subtle"
            :color="filter === 'completed' ? 'primary' : 'neutral'"
            class="cursor-pointer"
            @click="setFilter('completed')"
          >
            Completed
          </UBadge>
        </div>
      </div>

      <!-- Sort options -->
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-arrow-up-down"
          class="text-neutral-400"
        />
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Sort:</span>
        <div class="flex gap-2">
          <UBadge
            variant="subtle"
            :color="sort === 'date' ? 'primary' : 'neutral'"
            class="cursor-pointer"
            @click="setSort('date')"
          >
            Date
          </UBadge>
          <UBadge
            variant="subtle"
            :color="sort === 'title' ? 'primary' : 'neutral'"
            class="cursor-pointer"
            @click="setSort('title')"
          >
            Title
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="loading"
      class="space-y-3"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="border-default flex items-center justify-between rounded-lg border p-4"
      >
        <div class="flex items-center gap-3">
          <USkeleton class="h-5 w-5 rounded" />
          <div class="space-y-2">
            <USkeleton class="h-4 w-48" />
            <USkeleton class="h-3 w-32" />
          </div>
        </div>
        <USkeleton class="h-8 w-8 rounded" />
      </div>
    </div>

    <!-- Empty state -->
    <UEmpty
      v-else-if="todos.length === 0"
      icon="i-lucide-check-circle"
      title="No todos yet"
      description="Create your first one to get started!"
    />

    <!-- Todo list -->
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="border-default flex items-start gap-3 rounded-lg border p-4"
      >
        <UCheckbox
          :model-value="todo.completed"
          class="mt-1"
          @update:model-value="handleToggle(todo.id, $event)"
        />
        <div class="min-w-0 flex-1">
          <div
            class="truncate"
            :class="{
              'text-neutral-400 line-through dark:text-neutral-500': todo.completed,
              'font-medium text-neutral-900 dark:text-white': !todo.completed,
            }"
          >
            {{ todo.title }}
          </div>
          <p
            v-if="todo.description"
            class="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
            :class="{ 'line-through': todo.completed }"
          >
            {{ todo.description }}
          </p>
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            <UIcon
              name="i-lucide-clock"
              class="mr-1 inline"
            />
            {{ formatTime(todo.createdAt) }}
          </p>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          aria-label="Delete todo"
          @click="handleDelete(todo.id)"
        />
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="border-default flex items-center justify-between border-t pt-4"
      >
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ total }} total
        </p>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            variant="outline"
            size="sm"
            aria-label="Previous page"
            :disabled="page === 1"
            @click="setPage(page - 1)"
          />
          <span class="text-sm text-neutral-700 dark:text-neutral-300">
            {{ page }} / {{ totalPages }}
          </span>
          <UButton
            icon="i-lucide-chevron-right"
            variant="outline"
            size="sm"
            aria-label="Next page"
            :disabled="page === totalPages"
            @click="setPage(page + 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
