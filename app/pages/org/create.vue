<script setup lang="ts">
const { state, loading, schema, createOrganization } = useOrgCreate();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold">
          Create Organization
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Set up your new organization
        </p>
      </template>

      <UForm
        :state="state"
        :schema="schema"
        @submit.prevent="createOrganization"
      >
        <div class="space-y-4">
          <UFormField
            name="name"
            label="Organization Name"
            required
          >
            <UInput
              v-model="state.name"
              placeholder="My Organization"
            />
          </UFormField>

          <UFormField
            name="slug"
            label="URL Slug"
            required
            description="Used in the organization URL"
          >
            <UInput
              v-model="state.slug"
              placeholder="my-organization"
            />
          </UFormField>

          <UFormField
            name="description"
            label="Description"
          >
            <UTextarea
              v-model="state.description"
              placeholder="What does your organization do?"
              :rows="3"
            />
          </UFormField>

          <div class="flex gap-2 pt-4">
            <UButton
              type="submit"
              :loading="loading"
              block
            >
              Create Organization
            </UButton>
            <UButton
              variant="ghost"
              to="/org/select"
              :disabled="loading"
            >
              Cancel
            </UButton>
          </div>
        </div>
      </UForm>
    </UCard>
  </div>
</template>
