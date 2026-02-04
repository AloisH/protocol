<script setup lang="ts">
import type { Organization } from '../../../prisma/generated/client';

const router = useRouter();

const {
  data: organizations,
  pending,
  error,
  refresh,
} = await useFetch<{ organizations: Organization[] }>('/api/organizations');

function selectOrg(slug: string) {
  router.push(`/org/${slug}/dashboard`);
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-2xl">
      <template #header>
        <h1 class="text-2xl font-bold">
          Select Organization
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Choose an organization to continue
        </p>
      </template>

      <OrganizationSelectionList
        :organizations="organizations?.organizations ?? []"
        :pending="pending"
        :error="error"
        @select="selectOrg"
        @retry="refresh"
      />

      <template
        v-if="organizations?.organizations?.length"
        #footer
      >
        <UButton
          to="/org/create"
          variant="soft"
          icon="i-lucide-plus"
          block
        >
          Create New Organization
        </UButton>
      </template>
    </UCard>
  </div>
</template>
