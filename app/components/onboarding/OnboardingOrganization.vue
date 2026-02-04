<script setup lang="ts">
import type { CreateOrganizationInput } from '#shared/organization';
import { createOrganizationSchema } from '#shared/organization';

const model = defineModel<CreateOrganizationInput>({ required: true });

const name = computed(() => model.value.name);
const slug = computed({
  get: () => model.value.slug,
  set: v => (model.value.slug = v),
});
useSlugify(name, slug);
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="mb-2 text-lg font-semibold">
        Create Your Organization
      </h3>
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        Organizations help you collaborate with your team
      </p>
    </div>

    <UForm
      :state="model"
      :schema="createOrganizationSchema"
    >
      <div class="space-y-4">
        <UFormField
          name="name"
          label="Organization Name"
          required
        >
          <UInput
            v-model="model.name"
            placeholder="My Company"
          />
        </UFormField>

        <UFormField
          name="slug"
          label="URL Slug"
          required
          description="Used in the organization URL"
        >
          <UInput
            v-model="model.slug"
            placeholder="my-company"
          />
        </UFormField>

        <UFormField
          name="description"
          label="Description"
        >
          <UTextarea
            v-model="model.description"
            placeholder="What does your organization do?"
            :rows="3"
          />
        </UFormField>
      </div>
    </UForm>
  </div>
</template>
