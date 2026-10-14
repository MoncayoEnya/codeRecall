// Daily study reminders (phone only). One notification per remaining plan day,
// each naming that day's task.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PLAN, START, TEST } from './data';

export const remindersSupported = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// hour = 0–23, or null to turn reminders off. Returns false if permission was refused.
export async function scheduleReminders(hour) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (hour == null) return true;

  let perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Daily study reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const days = PLAN.flatMap((w) => w.days);
  const now = Date.now();
  const y = START.getFullYear(), m = START.getMonth(), d0 = START.getDate();
  const items = days.map(([title, task], i) => ({ when: new Date(y, m, d0 + i, hour, 0, 0), title, task }));
  items.push({ when: new Date(TEST.getFullYear(), TEST.getMonth(), TEST.getDate(), Math.min(hour, 6), 0, 0), title: 'Skills test today', task: 'Eat breakfast. Start the database first. Read each problem twice. You prepared for this.' });

  for (const it of items) {
    if (it.when.getTime() <= now + 60000) continue;
    const left = Math.round((TEST - new Date(it.when.getFullYear(), it.when.getMonth(), it.when.getDate())) / 86400000);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: left > 0 ? `${left} day${left === 1 ? '' : 's'} left · ${it.title}` : it.title,
        body: it.task,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: it.when, channelId: 'daily' },
    });
  }
  return true;
}
