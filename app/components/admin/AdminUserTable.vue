<script setup lang="ts">
import type { AdminUser } from '~/composables/admin/useAdminUsers';
import { h, resolveComponent } from 'vue';

interface Props {
  users: AdminUser[];
  loading: boolean;
  getRoleColor: (role: string) => string;
  getRoleIcon: (role: string) => string;
}

const { users, loading, getRoleColor, getRoleIcon } = defineProps<Props>();

const emit = defineEmits<Emits>();

interface Emits {
  (e: 'impersonate', user: AdminUser): void;
}

const columns = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: 'Email',
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }: { row: { original: AdminUser } }) =>
      h(
        resolveComponent('UBadge'),
        {
          color: getRoleColor(row.original.role),
          icon: getRoleIcon(row.original.role),
        },
        () => row.original.role,
      ),
  },
  {
    id: 'emailVerified',
    accessorKey: 'emailVerified',
    header: 'Verified',
    cell: ({ row }: { row: { original: AdminUser } }) =>
      row.original.emailVerified ? 'Yes' : 'No',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: { row: { original: AdminUser } }) => {
      if (row.original.role === 'SUPER_ADMIN') {
        return h('span', { class: 'text-xs text-neutral-400' }, 'Cannot impersonate');
      }
      return h(
        resolveComponent('UButton'),
        {
          size: 'xs',
          color: 'warning',
          variant: 'soft',
          onClick: () => { emit('impersonate', row.original); },
        },
        () => 'Impersonate',
      );
    },
  },
];
</script>

<template>
  <UTable
    :data="users"
    :columns="columns"
    :loading="loading"
  />
</template>
