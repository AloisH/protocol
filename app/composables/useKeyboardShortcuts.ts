export interface Shortcut {
  keys: string;
  label: string;
  category: 'navigation' | 'modals';
}

export const shortcuts: Shortcut[] = [
  {
    keys: 'meta_p',
    label: 'Open command palette',
    category: 'modals',
  },
  {
    keys: 'meta_k',
    label: 'Search protocols',
    category: 'navigation',
  },
  {
    keys: 'meta_slash',
    label: 'Show keyboard shortcuts',
    category: 'modals',
  },
];
