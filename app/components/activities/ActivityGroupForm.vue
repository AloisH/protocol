<script setup lang="ts">
import type { ActivityGroup } from '#shared/db/schema';

interface Props {
  group?: ActivityGroup | null;
  open?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<{
  'update:open': [boolean];
  'submit': [data: { name: string }];
}>();

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const name = ref('');

const isEditMode = computed(() => !!props.group);

watch(
  () => props.group,
  (group) => {
    name.value = group?.name ?? '';
  },
);

function onSubmit() {
  if (!name.value.trim())
    return;
  emit('submit', { name: name.value.trim() });
  isOpen.value = false;
  name.value = '';
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEditMode ? 'Edit Group' : 'New Group'"
    :description="isEditMode ? 'Rename this activity group' : 'Organize activities into a collapsible section'"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <UFormField label="Group Name" required>
        <UInput
          v-model="name"
          placeholder="e.g., Upper Body, Morning Routine"
          icon="i-lucide-folder"
          @keydown.enter="onSubmit"
        />
      </UFormField>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        @click="close"
      >
        Cancel
      </UButton>
      <UButton
        color="primary"
        :disabled="!name.trim()"
        icon="i-lucide-check"
        @click="onSubmit"
      >
        {{ isEditMode ? 'Update' : 'Create' }}
      </UButton>
    </template>
  </UModal>
</template>
