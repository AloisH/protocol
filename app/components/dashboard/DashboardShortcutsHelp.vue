<script setup lang="ts">
import { shortcuts } from '~/composables/shortcuts/useKeyboardShortcuts';

const isOpen = defineModel<boolean>('open', { default: false });

const navigationShortcuts = computed(() => shortcuts.filter(s => s.category === 'navigation'));

const modalShortcuts = computed(() => shortcuts.filter(s => s.category === 'modals'));

// Helper component for shortcut rows
const ShortcutRow = defineComponent({
  props: {
    label: { type: String, required: true },
    keys: { type: String, required: true },
  },
  setup(props) {
    const keyDisplay = computed(() => {
      return props.keys
        .replace('meta', isMac() ? 'Cmd' : 'Ctrl')
        .replace('shift', 'Shift')
        .replaceAll('_', ' + ')
        .toUpperCase();
    });

    // Split into individual keys for UKbd
    const keyParts = computed(() => keyDisplay.value.split(' + '));

    return () =>
      h('div', { class: 'flex items-center justify-between py-1' }, [
        h('span', { class: 'text-sm' }, props.label),
        h('div', { class: 'flex items-center gap-1' }, [
          ...keyParts.value.map(key => h(resolveComponent('UKbd'), { key }, () => key)),
        ]),
      ]);
  },
});

function isMac() {
  if (import.meta.server)
    return false;
  return navigator.platform.toLowerCase().includes('mac');
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <div class="p-6">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-semibold">
            Keyboard Shortcuts
          </h2>
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Close"
            @click="isOpen = false"
          />
        </div>

        <div class="space-y-6">
          <!-- Navigation -->
          <div>
            <h3 class="text-muted mb-3 text-sm font-medium tracking-wider uppercase">
              Navigation
            </h3>
            <div class="space-y-2">
              <ShortcutRow
                v-for="s in navigationShortcuts"
                :key="s.keys"
                :label="s.label"
                :keys="s.keys"
              />
            </div>
          </div>

          <!-- Modals -->
          <div>
            <h3 class="text-muted mb-3 text-sm font-medium tracking-wider uppercase">
              Modals
            </h3>
            <div class="space-y-2">
              <ShortcutRow
                v-for="s in modalShortcuts"
                :key="s.keys"
                :label="s.label"
                :keys="s.keys"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
