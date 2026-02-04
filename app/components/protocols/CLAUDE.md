# Protocol Components

Components for creating, editing, and managing protocols (routines).

## Components

### ProtocolForm.vue

Create and edit protocol dialogs using @nuxt/ui v4 UModal.

**Props:**

- `protocol?: Protocol` - Protocol to edit (omit for create mode)
- `modelValue?: boolean` - Dialog open/closed state (v-model)

**Emits:**

- `update:modelValue: [boolean]` - Emitted when dialog open state changes
- `submit: [data]` - Emitted on successful form submission with validated data

**Usage:**

```vue
<script setup lang="ts">
const formOpen = ref(false)
const selectedProtocol = ref<Protocol | null>(null)

function openCreateForm() {
  selectedProtocol.value = null
  formOpen.value = true
}

function openEditForm(protocol: Protocol) {
  selectedProtocol.value = protocol
  formOpen.value = true
}

async function handleFormSubmit(data: any) {
  if (selectedProtocol.value) {
    await updateProtocol(selectedProtocol.value.id, data)
  } else {
    await createProtocol(data.name, data.description, data.duration)
  }
  formOpen.value = false
}
</script>

<template>
  <ProtocolForm
    :protocol="selectedProtocol"
    v-model="formOpen"
    @submit="handleFormSubmit"
  />
</template>
```

**Features:**

- Create mode: Empty form with title "Create Protocol"
- Edit mode: Form pre-filled with protocol data
- Form validation with Zod schema (ProtocolFormSchema)
- Error display with UAlert component
- Loading state during submission
- Auto-closes modal on successful submit
- Watch for protocol prop changes to reset form

**Form Fields:**

- Name (required, icon: zap)
- Description (optional, textarea)
- Duration/Frequency (required, select: daily/weekly/monthly/yearly)

### DeleteProtocolDialog.vue

Confirmation dialog for protocol deletion with data warning.

**Props:**

- `protocol: Protocol | null` - Protocol to delete
- `modelValue?: boolean` - Dialog open/closed state (v-model)

**Emits:**

- `update:modelValue: [boolean]` - Emitted when dialog open state changes
- `confirm: []` - Emitted when user confirms deletion

**Usage:**

```vue
<script setup lang="ts">
const deleteDialogOpen = ref(false)
const selectedProtocol = ref<Protocol | null>(null)

function openDeleteDialog(protocol: Protocol) {
  selectedProtocol.value = protocol
  deleteDialogOpen.value = true
}

async function handleDeleteConfirm() {
  if (selectedProtocol.value) {
    await deleteProtocol(selectedProtocol.value.id)
    deleteDialogOpen.value = false
  }
}
</script>

<template>
  <DeleteProtocolDialog
    :protocol="selectedProtocol"
    v-model="deleteDialogOpen"
    @confirm="handleDeleteConfirm"
  />
</template>
```

**Features:**

- Warning icon with red accent (error color)
- Displays protocol name and description
- Shows warning about cascading deletion
- Disabled buttons during deletion
- Auto-closes on confirm
- Dismissible via close button or cancel button

### ProtocolCard.vue

Card component displaying protocol summary with edit/delete actions.

**Props:**

- `protocol: Protocol` - Protocol to display

**Emits:**

- `edit: [protocol]` - Emitted when edit button clicked
- `delete: [id]` - Emitted when delete button clicked

**Usage:**

```vue
<script setup lang="ts">
function openEditForm(protocol: Protocol) {
  // Handle edit
}

function openDeleteDialog(protocol: Protocol) {
  // Handle delete
}
</script>

<template>
  <ProtocolCard
    v-for="p in protocols"
    :key="p.id"
    :protocol="p"
    @edit="openEditForm"
    @delete="openDeleteDialog"
  />
</template>
```

**Features:**

- Card header with protocol name and status badge
- Status badge color mapping: active→success, paused→warning, completed→neutral
- Body shows frequency (Daily/Weekly/Monthly/Yearly), created date, target metric
- Footer with edit and delete buttons
- Icons for visual context (calendar, clock, target)
- Responsive grid layout

## V-model Binding Pattern

All dialogs use Vue 3 v-model with `modelValue` prop:

```vue
<!-- Parent -->
<ProtocolForm v-model="isOpen" :protocol="selected" @submit="handle" />

<!-- Component -->
<script setup>
const props = withDefaults(defineProps<{
  modelValue?: boolean
}>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>
```

## Color Mapping

Valid @nuxt/ui v4 semantic colors:

- `primary` - Default brand color
- `secondary` - Alternative brand color
- `success` - Green (active status)
- `warning` - Yellow (paused status)
- `error` - Red (deletion, warnings)
- `info` - Blue (information)
- `neutral` - Gray (inactive, completed)

## Accessibility

- Form fields have `aria-label` attributes
- Delete dialog uses semantic header structure
- Modal close button accessible
- Buttons have proper `disabled` state
- Error messages in UAlert for announcements
- Proper focus management in modals

## Testing

See `[ProtocolCard.test.ts]` for component testing patterns with @nuxt/test-utils.

## Dependencies

- Nuxt UI v4: UModal, UForm, UButton, UAlert, UCard, UIcon
- Zod: Form validation
- Shared schemas: `#shared/schemas/protocols`
- Shared types: `#shared/db/schema`
