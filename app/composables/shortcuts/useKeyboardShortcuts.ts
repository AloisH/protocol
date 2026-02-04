/**
 * Global keyboard shortcuts registry
 * Use defineShortcuts from Nuxt UI
 */

export interface ShortcutItem {
  keys: string;
  label: string;
  category: 'navigation' | 'actions' | 'modals';
}

export const shortcuts: ShortcutItem[] = [
  { keys: 'meta_k', label: 'Open command palette', category: 'modals' },
  { keys: 'meta_b', label: 'Toggle sidebar', category: 'navigation' },
  { keys: 'meta_shift_k', label: 'Show shortcuts help', category: 'modals' },
  { keys: 'escape', label: 'Close modal', category: 'modals' },
];

export function useKeyboardShortcuts(options: {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcutsHelp?: () => void;
}) {
  const { onToggleSidebar, onOpenCommandPalette, onOpenShortcutsHelp } = options;

  defineShortcuts({
    meta_k: () => onOpenCommandPalette?.(),
    meta_b: () => onToggleSidebar?.(),
    meta_shift_k: () => onOpenShortcutsHelp?.(),
  });

  return {
    shortcuts,
  };
}
