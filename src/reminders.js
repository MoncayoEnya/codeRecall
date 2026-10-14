// Web: browsers can't schedule notifications for future days, so reminders are phone-only.
export const remindersSupported = false;
export async function scheduleReminders() {
  return false;
}
