<script setup lang="ts">
const { settings, loadSettings, updateSettings } = useSettings();
const { permission, supported, init, requestPermission, showNotification } = useNotifications();

const loading = ref(false);
const testSuccess = ref(false);

type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const daysOptions: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

onMounted(async () => {
  init();
  await loadSettings();
});

async function handleToggle(enabled: boolean) {
  if (enabled && permission.value !== 'granted') {
    const granted = await requestPermission();
    if (!granted)
      return;
  }
  await updateSettings({ notificationsEnabled: enabled });
}

async function handleTimeChange(time: string) {
  await updateSettings({ reminderTime: time });
}

async function handleDaysChange(days: DayOfWeek[]) {
  await updateSettings({ reminderDays: days });
}

async function handleRequestPermission() {
  loading.value = true;
  await requestPermission();
  loading.value = false;
}

function handleTestNotification() {
  const notification = showNotification('Protocol Reminder', {
    body: 'Time to complete your daily protocols!',
  });
  if (notification) {
    testSuccess.value = true;
    setTimeout(() => {
      testSuccess.value = false;
    }, 3000);
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-bell" class="size-5" />
        <h3 class="font-semibold">
          Notifications
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <UAlert
        v-if="!supported"
        description="Notifications not supported in this browser"
        color="warning"
        icon="i-lucide-alert-triangle"
        variant="soft"
      />

      <template v-else>
        <!-- Permission status -->
        <div v-if="permission === 'denied'" class="mb-4">
          <UAlert
            description="Notifications blocked. Enable in browser settings."
            color="error"
            icon="i-lucide-bell-off"
            variant="soft"
          />
        </div>

        <div v-else-if="permission === 'default'" class="mb-4">
          <UButton
            :loading="loading"
            icon="i-lucide-bell-ring"
            variant="soft"
            @click="handleRequestPermission"
          >
            Enable Notifications
          </UButton>
        </div>

        <!-- Settings (only when permission granted) -->
        <template v-if="permission === 'granted'">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">
                Daily Reminders
              </p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Get notified to complete protocols
              </p>
            </div>
            <USwitch
              :model-value="settings?.notificationsEnabled ?? false"
              @update:model-value="handleToggle"
            />
          </div>

          <div v-if="settings?.notificationsEnabled" class="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <div>
              <p class="block text-sm font-medium mb-1">
                Reminder Time
              </p>
              <UInput
                type="time"
                :model-value="settings?.reminderTime ?? '09:00'"
                class="w-32"
                @update:model-value="handleTimeChange"
              />
            </div>

            <div>
              <p class="block text-sm font-medium mb-2">
                Reminder Days
              </p>
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="day in daysOptions"
                  :key="day.value"
                  size="sm"
                  :variant="(settings?.reminderDays ?? []).includes(day.value) ? 'solid' : 'outline'"
                  @click="handleDaysChange(
                    (settings?.reminderDays ?? []).includes(day.value)
                      ? (settings?.reminderDays ?? []).filter(d => d !== day.value)
                      : [...(settings?.reminderDays ?? []), day.value],
                  )"
                >
                  {{ day.label }}
                </UButton>
              </div>
            </div>

            <div class="pt-2">
              <UButton
                variant="soft"
                icon="i-lucide-send"
                size="sm"
                @click="handleTestNotification"
              >
                Test Notification
              </UButton>
              <p v-if="testSuccess" class="text-sm text-green-600 dark:text-green-400 mt-2">
                Notification sent!
              </p>
            </div>
          </div>
        </template>
      </template>
    </div>
  </UCard>
</template>
