import { beforeEach, describe, expect, it, vi } from 'vitest';

interface RegisteredShortcuts {
  meta_k: () => void;
  meta_b: () => void;
  meta_shift_k: () => void;
}

// Mock defineShortcuts with captured handlers
let capturedHandlers: RegisteredShortcuts | null = null;
const mockDefineShortcuts = vi.fn((handlers: RegisteredShortcuts) => {
  capturedHandlers = handlers;
});
vi.stubGlobal('defineShortcuts', mockDefineShortcuts);

// Import after mocks
const { useKeyboardShortcuts, shortcuts } = await import('./useKeyboardShortcuts');

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedHandlers = null;
  });

  describe('shortcuts constant', () => {
    it('exports predefined shortcuts', () => {
      expect(shortcuts).toBeInstanceOf(Array);
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('has command palette shortcut', () => {
      const cmdK = shortcuts.find(s => s.keys === 'meta_k');
      expect(cmdK).toBeDefined();
      expect(cmdK?.category).toBe('modals');
    });

    it('has sidebar toggle shortcut', () => {
      const cmdB = shortcuts.find(s => s.keys === 'meta_b');
      expect(cmdB).toBeDefined();
      expect(cmdB?.category).toBe('navigation');
    });

    it('has shortcuts help shortcut', () => {
      const cmdShiftK = shortcuts.find(s => s.keys === 'meta_shift_k');
      expect(cmdShiftK).toBeDefined();
      expect(cmdShiftK?.category).toBe('modals');
    });

    it('has escape shortcut', () => {
      const escape = shortcuts.find(s => s.keys === 'escape');
      expect(escape).toBeDefined();
      expect(escape?.category).toBe('modals');
    });

    it('all shortcuts have required fields', () => {
      for (const shortcut of shortcuts) {
        expect(shortcut).toHaveProperty('keys');
        expect(shortcut).toHaveProperty('label');
        expect(shortcut).toHaveProperty('category');
        expect(['navigation', 'actions', 'modals']).toContain(shortcut.category);
      }
    });
  });

  describe('useKeyboardShortcuts', () => {
    it('returns shortcuts array', () => {
      const result = useKeyboardShortcuts({});
      expect(result.shortcuts).toBe(shortcuts);
    });

    it('registers shortcuts with defineShortcuts', () => {
      useKeyboardShortcuts({
        onToggleSidebar: vi.fn() as () => void,
        onOpenCommandPalette: vi.fn() as () => void,
        onOpenShortcutsHelp: vi.fn() as () => void,
      });

      expect(mockDefineShortcuts).toHaveBeenCalledWith(
        expect.objectContaining({
          meta_k: expect.any(Function) as unknown,
          meta_b: expect.any(Function) as unknown,
          meta_shift_k: expect.any(Function) as unknown,
        }),
      );
    });

    it('calls callbacks when shortcuts triggered', () => {
      const onToggleSidebar = vi.fn();
      const onOpenCommandPalette = vi.fn();
      const onOpenShortcutsHelp = vi.fn();

      useKeyboardShortcuts({
        onToggleSidebar,
        onOpenCommandPalette,
        onOpenShortcutsHelp,
      });

      expect(capturedHandlers).not.toBeNull();
      capturedHandlers!.meta_k();
      capturedHandlers!.meta_b();
      capturedHandlers!.meta_shift_k();

      expect(onOpenCommandPalette).toHaveBeenCalled();
      expect(onToggleSidebar).toHaveBeenCalled();
      expect(onOpenShortcutsHelp).toHaveBeenCalled();
    });

    it('handles undefined callbacks gracefully', () => {
      useKeyboardShortcuts({});

      expect(capturedHandlers).not.toBeNull();
      // Should not throw
      expect(() => {
        capturedHandlers!.meta_k();
      }).not.toThrow();
      expect(() => {
        capturedHandlers!.meta_b();
      }).not.toThrow();
      expect(() => {
        capturedHandlers!.meta_shift_k();
      }).not.toThrow();
    });
  });
});
