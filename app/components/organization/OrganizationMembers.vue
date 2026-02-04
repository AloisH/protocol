<script setup lang="ts">
import type { OrganizationMember, OrganizationRole } from '../../../prisma/generated/client';
import { inviteMemberSchema } from '#shared/organization';
import { h, resolveComponent } from 'vue';

interface Props {
  organizationSlug: string;
}

const { organizationSlug } = defineProps<Props>();

const toast = useToast();
const { user } = useAuth();
const { members, currentUserRole, canManageMembers, fetchMembers, updateMemberRole, removeMember }
  = useOrganization();

// Fetch members on mount
onMounted(() => fetchMembers(organizationSlug));

const isOwner = computed(() => currentUserRole.value === 'OWNER');

const inviteModalOpen = ref(false);
const removeModalOpen = ref(false);
const memberToRemove = ref<string | null>(null);
const removing = ref(false);
const inviteState = ref({
  email: '',
  role: 'MEMBER' as OrganizationRole,
});
const inviting = ref(false);

const roleColors = {
  OWNER: 'error',
  ADMIN: 'warning',
  MEMBER: 'primary',
  GUEST: 'neutral',
} as const;

const roleIcons = {
  OWNER: 'i-lucide-crown',
  ADMIN: 'i-lucide-shield',
  MEMBER: 'i-lucide-user',
  GUEST: 'i-lucide-eye',
} as const;

const columns = [
  {
    id: 'name',
    accessorKey: 'user.name',
    header: 'Name',
    cell: ({
      row,
    }: {
      row: {
        original: OrganizationMember & {
          user: { name: string; email: string; image: string | null };
        };
      };
    }) => {
      const user = row.original.user;
      return h('div', { class: 'flex items-center gap-2' }, [
        h(resolveComponent('UAvatar'), {
          src: user.image || undefined,
          alt: user.name,
          size: 'xs',
        }),
        h('span', user.name),
      ]);
    },
  },
  {
    id: 'email',
    accessorKey: 'user.email',
    header: 'Email',
    cell: ({ row }: { row: { original: OrganizationMember & { user: { email: string } } } }) =>
      row.original.user.email,
  },
  {
    id: 'role',
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }: { row: { original: OrganizationMember } }) => {
      return h(
        resolveComponent('UBadge'),
        {
          color: roleColors[row.original.role as keyof typeof roleColors],
          icon: roleIcons[row.original.role as keyof typeof roleIcons],
        },
        () => row.original.role,
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }: { row: { original: OrganizationMember & { user: { id: string } } } }) => {
      const member = row.original;
      const currentUserId = user.value?.id;
      const isSelf = member.userId === currentUserId;
      const canEdit = isOwner.value && !isSelf;
      const canRemove = canManageMembers.value && !isSelf;

      return h(
        'div',
        { class: 'flex gap-2' },
        [
          // Role dropdown (OWNER only, not self)
          canEdit
            ? h(resolveComponent('USelect'), {
                'modelValue': member.role,
                'options': [
                  { value: 'OWNER', label: 'Owner' },
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'MEMBER', label: 'Member' },
                  { value: 'GUEST', label: 'Guest' },
                ],
                'onUpdate:modelValue': (newRole: OrganizationRole) =>
                  handleRoleChange(member.userId, newRole),
              })
            : h(
                resolveComponent('UBadge'),
                {
                  color: roleColors[member.role as keyof typeof roleColors],
                  icon: roleIcons[member.role as keyof typeof roleIcons],
                },
                () => member.role,
              ),

          // Remove button (OWNER/ADMIN, not self)
          canRemove
            ? h(resolveComponent('UButton'), {
                'icon': 'i-lucide-trash-2',
                'size': 'xs',
                'color': 'error',
                'variant': 'ghost',
                'aria-label': 'Remove member',
                'onClick': () => { openRemoveModal(member.userId); },
              })
            : null,
        ].filter(Boolean),
      );
    },
  },
];

function openInviteModal() {
  inviteModalOpen.value = true;
  inviteState.value.email = '';
  inviteState.value.role = 'MEMBER';
}

async function sendInvite() {
  inviting.value = true;
  try {
    await $fetch(`/api/organizations/${organizationSlug}/invites`, {
      method: 'POST',
      body: inviteState.value,
    });

    toast.add({
      title: 'Success',
      description: 'Invitation sent',
      color: 'success',
      icon: 'i-lucide-check',
    });

    inviteModalOpen.value = false;
  }
  catch (err) {
    const error = err as { data?: { message?: string } };
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to send invite',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
  }
  finally {
    inviting.value = false;
  }
}

async function handleRoleChange(userId: string, role: OrganizationRole) {
  try {
    await updateMemberRole(organizationSlug, userId, role);
    toast.add({
      title: 'Success',
      description: 'Member role updated',
      color: 'success',
      icon: 'i-lucide-check',
    });
  }
  catch (err) {
    const error = err as { data?: { message?: string } };
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to update role',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
  }
}

function openRemoveModal(userId: string) {
  memberToRemove.value = userId;
  removeModalOpen.value = true;
}

async function confirmRemove() {
  if (!memberToRemove.value)
    return;

  removing.value = true;
  try {
    await removeMember(organizationSlug, memberToRemove.value);
    toast.add({
      title: 'Success',
      description: 'Member removed',
      color: 'success',
      icon: 'i-lucide-check',
    });
    removeModalOpen.value = false;
  }
  catch (err) {
    const error = err as { data?: { message?: string } };
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to remove member',
      color: 'error',
      icon: 'i-lucide-alert-triangle',
    });
  }
  finally {
    removing.value = false;
    memberToRemove.value = null;
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        Members
      </h2>
      <UButton
        v-if="isOwner"
        icon="i-lucide-user-plus"
        @click="openInviteModal"
      >
        Invite Member
      </UButton>
    </div>

    <UTable
      :data="[...members]"
      :columns="columns"
    />

    <UModal v-model:open="inviteModalOpen">
      <template #content="{ close }">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Invite Member
            </h3>
          </template>

          <UForm
            :state="inviteState"
            :schema="inviteMemberSchema"
            @submit.prevent="sendInvite"
          >
            <div class="space-y-4">
              <UFormField
                name="email"
                label="Email"
                required
              >
                <UInput
                  v-model="inviteState.email"
                  type="email"
                  placeholder="member@example.com"
                />
              </UFormField>

              <UFormField
                name="role"
                label="Role"
              >
                <USelect
                  v-model="inviteState.role"
                  :options="[
                    { value: 'MEMBER', label: 'Member' },
                    { value: 'ADMIN', label: 'Admin' },
                    { value: 'GUEST', label: 'Guest' },
                  ]"
                  option-attribute="label"
                  value-attribute="value"
                />
              </UFormField>

              <div class="flex gap-2 pt-4">
                <UButton
                  type="submit"
                  :loading="inviting"
                  block
                >
                  Send Invitation
                </UButton>
                <UButton
                  variant="ghost"
                  :disabled="inviting"
                  @click="close"
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </UForm>
        </UCard>
      </template>
    </UModal>

    <UModal v-model:open="removeModalOpen">
      <template #content="{ close }">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Remove Member
            </h3>
          </template>

          <p>Are you sure you want to remove this member?</p>

          <template #footer>
            <div class="flex gap-2">
              <UButton
                color="error"
                :loading="removing"
                @click="confirmRemove"
              >
                Remove
              </UButton>
              <UButton
                variant="ghost"
                :disabled="removing"
                @click="close"
              >
                Cancel
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
