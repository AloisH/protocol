import { db } from '#shared/db/schema';

export default defineNuxtPlugin(async () => {
  // Only run on client
  if (!import.meta.client)
    return;

  // Wait for DOM ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  const settings = await db.settings.get('default');
  if (!settings?.notificationsEnabled)
    return;
  if (Notification.permission !== 'granted')
    return;

  // Check if today is a reminder day
  const today = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const todayName = dayNames[today.getDay()];
  const reminderDays = settings.reminderDays ?? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  if (!todayName || !reminderDays.includes(todayName))
    return;

  // Check reminder time
  const reminderTime = settings.reminderTime ?? '09:00';
  const [hours = 9, minutes = 0] = reminderTime.split(':').map(Number);
  const reminderDate = new Date(today);
  reminderDate.setHours(hours, minutes, 0, 0);

  // Only show if past reminder time
  if (today < reminderDate)
    return;

  // Check if already shown today (use localStorage)
  const lastShown = localStorage.getItem('lastReminderDate');
  const todayStr = today.toISOString().split('T')[0];
  if (lastShown === todayStr)
    return;

  // Check if any protocols incomplete today
  const protocols = await db.protocols.where('status').equals('active').toArray();
  if (protocols.length === 0)
    return;

  const completions = await db.dailyCompletions
    .where('date')
    .equals(todayStr ?? '')
    .toArray();

  const completedIds = new Set(completions.map(c => c.protocolId));
  const incompleteCount = protocols.filter(p => p.id && !completedIds.has(p.id)).length;

  if (incompleteCount === 0)
    return;

  // Show notification
  // eslint-disable-next-line no-new
  new Notification('Protocol Reminder', {
    body: `${incompleteCount} protocol${incompleteCount > 1 ? 's' : ''} to complete today`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
  });

  localStorage.setItem('lastReminderDate', todayStr ?? '');
});
