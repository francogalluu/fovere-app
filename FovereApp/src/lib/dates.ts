/**
 * All dates in this app are YYYY-MM-DD strings in the user's local timezone.
 * Never parse bare ISO strings directly — always append T00:00:00 to force
 * local-time parsing and avoid UTC-offset day shifts.
 */

export const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const today = (): string => toLocalDateString(new Date());

export const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
};

export const isToday = (dateStr: string): boolean => dateStr === today();
export const isFuture = (dateStr: string): boolean => dateStr > today();
export const isPast = (dateStr: string): boolean => dateStr < today();

export const formatDateTitle = (dateStr: string): string => {
  if (isToday(dateStr)) return 'Today';
  if (dateStr === addDays(today(), -1)) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
};

/**
 * Returns 7 YYYY-MM-DD strings for the week containing anchorDate.
 * Week starts on Sunday (index 0).
 */
export const getWeekDates = (anchorDate: string): string[] => {
  const d = new Date(anchorDate + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0 = Sunday
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return toLocalDateString(day);
  });
};

export const getDayOfMonth = (dateStr: string): number =>
  parseInt(dateStr.split('-')[2], 10);

export const getDayOfWeekIndex = (dateStr: string): number =>
  new Date(dateStr + 'T00:00:00').getDay();

/** Short day labels indexed Sunday → Saturday */
export const SHORT_DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** Build an inclusive array of YYYY-MM-DD strings from `from` to `to` */
export const datesInRange = (from: string, to: string): string[] => {
  const result: string[] = [];
  let cur = from;
  while (cur <= to) {
    result.push(cur);
    cur = addDays(cur, 1);
  }
  return result;
};
