export interface Shortcut {
  keys: string;
  label: string;
  category: 'navigation' | 'modals';
}

export const shortcuts: Shortcut[] = [
  {
    keys: 'meta_p',
    label: 'Go to protocols',
    category: 'navigation',
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

export function useKeyboardShortcuts() {
  const shortcutsHelpOpen = useState('shortcuts-help-open', () => false);
  const router = useRouter();

  function onKeydown(e: KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey;
    if (!meta)
      return;

    if (e.key === 'p') {
      e.preventDefault();
      void router.push('/protocols');
    }
    else if (e.key === 'k') {
      e.preventDefault();
      void router.push('/protocols');
    }
    else if (e.key === '/') {
      e.preventDefault();
      shortcutsHelpOpen.value = !shortcutsHelpOpen.value;
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown));

  return { shortcutsHelpOpen };
}
