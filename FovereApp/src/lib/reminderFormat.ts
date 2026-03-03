/**
 * Format habit reminder for display (detail screen, list, etc.).
 * Uses i18n for weekday names and optional "day of month" phrasing.
 */

import type { Habit } from '@/types/habit';

const WEEKDAY_KEYS = ['weekdaySun', 'weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat'] as const;

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Returns a short display string for the habit's reminder (e.g. "8:00 AM", "Mon, Wed 8:00 AM", "15th 8:00 AM").
 * Returns null if habit has no reminder.
 */
export function formatReminderDisplay(
  habit: Habit,
  t: (key: string) => string,
): string | null {
  if (!habit.reminderTime) return null;
  const timeStr = formatTime(habit.reminderTime);
  if (habit.frequency === 'weekly' && habit.reminderWeekdays?.length) {
    const days = habit.reminderWeekdays
      .slice()
      .sort((a, b) => a - b)
      .map(w => t(`wizard.${WEEKDAY_KEYS[w - 1]}`))
      .join(', ');
    return `${days} ${timeStr}`;
  }
  if (habit.frequency === 'monthly' && habit.reminderDayOfMonth != null) {
    const day = Math.min(31, Math.max(1, habit.reminderDayOfMonth));
    return t('wizard.reminderMonthlyPreview', { day: String(day), time: timeStr });
  }
  return timeStr;
}
