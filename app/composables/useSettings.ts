import type { Settings } from '#shared/db/schema';
import { db } from '#shared/db/schema';
import { SettingsSchema } from '#shared/schemas/db';

const DEFAULT_USER_ID = 'default';

export function useSettings() {
  const settings = useState<Settings | null>('settings', () => null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadSettings() {
    loading.value = true;
    error.value = null;
    try {
      let stored = await db.settings.get(DEFAULT_USER_ID);
      if (!stored) {
        stored = {
          userId: DEFAULT_USER_ID,
          theme: 'auto',
          notificationsEnabled: false,
          reminderTime: '09:00',
          reminderDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
        };
        await db.settings.add(stored);
      }
      settings.value = stored;
    }
    catch (e) {
      error.value = `Failed to load settings: ${String(e)}`;
      console.error(error.value, e);
    }
    finally {
      loading.value = false;
    }
  }

  async function updateSettings(updates: Partial<Settings>) {
    error.value = null;
    try {
      const current = settings.value ?? {
        userId: DEFAULT_USER_ID,
        theme: 'auto' as const,
        notificationsEnabled: false,
      };

      const updated = { ...current, ...updates };
      SettingsSchema.parse(updated);

      await db.settings.put(updated);
      settings.value = updated;
      return updated;
    }
    catch (e) {
      error.value = `Failed to update settings: ${String(e)}`;
      console.error(error.value, e);
      throw e;
    }
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    loadSettings,
    updateSettings,
  };
}
