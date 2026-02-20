import type { Habit, HabitEntry } from '@/types/habit';
import { getWeekDates, datesInRange } from './dates';

// ─── Entry lookup ─────────────────────────────────────────────────────────────

const entryValue = (entries: HabitEntry[], habitId: string, date: string): number =>
  entries.find(e => e.id === `${habitId}_${date}`)?.value ?? 0;

// ─── Habit-level value for a given date/period ────────────────────────────────

/**
 * Returns the progress value for a habit on a given anchor date,
 * taking frequency into account:
 *
 * - daily:   entry for that exact date
 * - weekly:  sum of entries across the week containing the date
 * - monthly: sum of entries across the full calendar month of the date
 *
 * This is the "current" value shown in HabitCard and HabitDetail.
 */
export const getHabitCurrentValue = (
  habit: Habit,
  entries: HabitEntry[],
  date: string,
): number => {
  if (habit.frequency === 'weekly') {
    const weekDates = getWeekDates(date);
    return weekDates.reduce((sum, d) => sum + entryValue(entries, habit.id, d), 0);
  }
  if (habit.frequency === 'monthly') {
    const [year, month] = date.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const to = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    return datesInRange(from, to).reduce(
      (sum, d) => sum + entryValue(entries, habit.id, d),
      0,
    );
  }
  // daily (and boolean)
  return entryValue(entries, habit.id, date);
};

/** True if the habit is fully completed for the given anchor date/period. */
export const isHabitCompleted = (
  habit: Habit,
  entries: HabitEntry[],
  date: string,
): boolean => getHabitCurrentValue(habit, entries, date) >= habit.target;

// ─── Day-level aggregates ─────────────────────────────────────────────────────

/**
 * Overall completion % (0–100) for all active habits on a given date.
 * Only habits that existed on `date` (createdAt <= date) are counted.
 */
export const dailyCompletion = (
  habits: Habit[],
  entries: HabitEntry[],
  date: string,
): number => {
  const active = habits.filter(h => h.archivedAt === null && h.createdAt <= date);
  if (active.length === 0) return 0;
  const completed = active.filter(h => isHabitCompleted(h, entries, date)).length;
  return Math.round((completed / active.length) * 100);
};

/** Completed vs. total counts for a given date (used in ProgressHero). */
export const dailyCompletedCount = (
  habits: Habit[],
  entries: HabitEntry[],
  date: string,
): { completed: number; total: number } => {
  const active = habits.filter(h => h.archivedAt === null && h.createdAt <= date);
  const completed = active.filter(h => isHabitCompleted(h, entries, date)).length;
  return { completed, total: active.length };
};

// ─── Week / month aggregates (used in Calendar + Analytics) ──────────────────

/** Mean daily completion % across a 7-day week starting from weekStartDate. */
export const weeklyScore = (
  habits: Habit[],
  entries: HabitEntry[],
  weekStartDate: string,
): number => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const scores = days.map(d => dailyCompletion(habits, entries, d));
  return Math.round(scores.reduce((a, b) => a + b, 0) / 7);
};
