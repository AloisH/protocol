<script setup lang="ts">
import type { ActivityGroup } from '#shared/db/schema';

interface Props {
  group?: ActivityGroup | null;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  'update:modelValue': [boolean];
  'submit': [data: { name: string }];
}>();

const isOpen = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value),
});

const name = ref('');

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
  <UModal v-model="isOpen" :title="group ? 'Edit Group' : 'New Group'">
    <template #body>
      <div class="p-4">
        <UFormField label="Group Name" required>
          <UInput
            v-model="name"
            placeholder="e.g., Upper Body, Morning Routine"
            @keydown.enter="onSubmit"
          />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton :disabled="!name.trim()" @click="onSubmit">
          {{ group ? 'Update' : 'Create' }} Group
        </UButton>
      </div>
    </template>
  </UModal>
</template>
