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

/**
 * Current date as YYYY-MM-DD in local time (midnight, no time component).
 * Use this for initializing selectedDate and any "today" comparison so the app
 * always starts on the current calendar day and reopens on the new day when
 * the user returns.
 */
export const getTodayNormalized = (): string => toLocalDateString(new Date());

export const today = (): string => getTodayNormalized();

export const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
};

/** Add n months to a YYYY-MM-DD string; result is same day of month when possible. */
export const addMonths = (dateStr: string, n: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return toLocalDateString(d);
};

/** Return YYYY-MM for the month containing dateStr. */
export const getMonthKey = (dateStr: string): string => {
  const [y, m] = dateStr.split('-');
  return `${y}-${m}`;
};

/** Last n calendar months ending at endDate (inclusive). Each has start, end (YYYY-MM-DD) and short label (e.g. "Sep"). */
export const getLastNMonthRanges = (
  endDate: string,
  n: number,
): { start: string; end: string; label: string; monthKey: string }[] => {
  const result: { start: string; end: string; label: string; monthKey: string }[] = [];
  const d = new Date(endDate + 'T00:00:00');
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    const startStr = toLocalDateString(start);
    const endStr = toLocalDateString(end);
    const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = start.toLocaleDateString('en-US', { month: 'short' });
    result.unshift({ start: startStr, end: endStr, label, monthKey });
    d.setMonth(d.getMonth() - 1);
  }
  return result;
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

/**
 * Normalize a date to YYYY-MM-DD at midnight local.
 * Accepts YYYY-MM-DD string or Date; returns YYYY-MM-DD.
 */
export const normalizeDate = (date: string | Date): string => {
  if (typeof date === 'string') {
    const d = new Date(date + 'T00:00:00');
    return toLocalDateString(d);
  }
  return toLocalDateString(date);
};

/** Inclusive week range (Sun–Sat) for the week containing the given date. */
export const getWeekRange = (dateStr: string): { start: string; end: string } => {
  const days = getWeekDates(dateStr);
  return { start: days[0], end: days[6] };
};

/** Inclusive month range for the month containing the given date. */
export const getMonthRange = (dateStr: string): { start: string; end: string } => {
  const d = new Date(dateStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = d.getMonth();
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

/**
 * Week segments within a calendar month (1–7, 8–14, 15–21, 22–28, 29–31).
 * Used for month-view analytics bars. Each segment has start/end YYYY-MM-DD and a short label.
 */
export const getMonthWeekSegments = (
  monthStart: string,
  monthEnd: string,
): { start: string; end: string; label: string }[] => {
  const [y, m] = monthStart.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const monthName = new Date(monthStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });
  const segments: { start: string; end: string; label: string }[] = [];
  for (let a = 1; a <= lastDay; a += 7) {
    const b = Math.min(a + 6, lastDay);
    const startStr = `${y}-${String(m).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
    const endStr = `${y}-${String(m).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
    segments.push({ start: startStr, end: endStr, label: `${monthName} ${a}–${b}` });
  }
  return segments;
};
