import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Svg, { Line } from 'react-native-svg';
import { Flame, CalendarCheck } from 'lucide-react-native';
import {
  today,
  datesInRange,
  addDays,
  addMonths,
  getWeekDates,
  getWeeksRange,
  getMonthKey,
  getLastNMonthRanges,
  getShortDayLabels,
  getDayOfWeekColumnIndex,
  getDateLocale,
  getLast7Days,
} from '@/lib/dates';
import { format } from 'date-fns';
import {
  dailyCompletion,
  entryValue,
  getHabitCurrentValue,
  isHabitActiveOnDate,
  isHabitCompleted,
} from '@/lib/aggregates';
import type { Palette } from '@/lib/theme';
import type { Habit, HabitEntry } from '@/types/habit';
import { BarChartWithTooltip, type ChartBar } from '@/components/charts/BarChartWithTooltip';
import { ScoreRing } from '@/components/ScoreRing';
import { useHabitStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/context/ThemeContext';
import { useHabitLogs } from '@/hooks/useHabitLogs';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = 'day' | 'week' | 'month' | '6month' | 'year';
export type ChartBucket = { key: string; label: string; start: string; end: string; dates?: string[] };
export type { ChartBar };

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TFunction = (key: string, opts?: { [k: string]: string | number }) => string;

/** Build buckets for chart. For 'week', use only YYYY-MM-DD (key/start/end); labels are for display only and must not be used for aggregation. */
function getBuckets(range: TimeRange, endDate: string, weekStartsOn: 0 | 1, t: TFunction, useWeekBuckets = false): ChartBucket[] {
  if (useWeekBuckets) {
    const locale = getDateLocale();
    const weekLabelFormat = 'd/M';
    switch (range) {
      case 'day':
        return [{ key: endDate, label: t('common.today'), start: endDate, end: endDate }];
      case 'week': {
        const weeks = getWeeksRange(6, 0, weekStartsOn);
        return weeks.map((weekDays) => {
          const start = weekDays[0];
          const end = weekDays[6];
          const label = format(new Date(start + 'T00:00:00'), weekLabelFormat, { locale });
          return { key: start, label, start, end, dates: weekDays };
        });
      }
      case 'month': {
        const weeks = getWeeksRange(3, 0, weekStartsOn);
        return weeks.map((weekDays) => {
          const start = weekDays[0];
          const end = weekDays[6];
          const label = format(new Date(start + 'T00:00:00'), weekLabelFormat, { locale });
          return { key: start, label, start, end, dates: weekDays };
        });
      }
      case '6month': {
        const weeks = getWeeksRange(25, 0, weekStartsOn);
        return weeks.map((weekDays) => {
          const start = weekDays[0];
          const end = weekDays[6];
          const label = format(new Date(start + 'T00:00:00'), weekLabelFormat, { locale });
          return { key: start, label, start, end, dates: weekDays };
        });
      }
      case 'year': {
        const weeks = getWeeksRange(51, 0, weekStartsOn);
        return weeks.map((weekDays) => {
          const start = weekDays[0];
          const end = weekDays[6];
          const label = format(new Date(start + 'T00:00:00'), weekLabelFormat, { locale });
          return { key: start, label, start, end, dates: weekDays };
        });
      }
    }
  }
  switch (range) {
    case 'day':
      return [{ key: endDate, label: t('common.today'), start: endDate, end: endDate }];
    case 'week': {
      const weekDates = getLast7Days(endDate);
      const dayLabels = getShortDayLabels(weekStartsOn);
      return weekDates.map(d => ({
        key: d,
        label: dayLabels[getDayOfWeekColumnIndex(d, weekStartsOn)],
        start: d,
        end: d,
      }));
    }
    case 'month': {
      const start = addDays(endDate, -29);
      const days = datesInRange(start, endDate);
      return days.map(d => ({
        key: d,
        label: d,
        start: d,
        end: d,
      }));
    }
    case '6month':
      return getLastNMonthRanges(endDate, 6).map(({ start, end, label, monthKey }) => ({ key: monthKey, label, start, end }));
    case 'year':
      return getLastNMonthRanges(endDate, 12).map(({ start, end, label, monthKey }) => ({ key: monthKey, label, start, end }));
  }
}

/** Uses all habits; for each date d, counts only habits active on that date (isHabitActiveOnDate). Only counts dates <= todayStr (no future). */
function aggregateCompletions(
  habits: Habit[],
  entries: HabitEntry[],
  buckets: ChartBucket[],
  habitFilter: Habit | null,
  weekStartsOn: 0 | 1,
  todayStr: string,
): { completed: number; target: number; averagePercent?: number }[] {
  const analyticsOptions = { maxDate: todayStr };
  return buckets.map(bucket => {
    // Weekly habit + month bucket (e.g. yearly view): count completed weeks in that month
    if (habitFilter?.frequency === 'weekly' && !bucket.dates) {
      const monthDays = datesInRange(bucket.start, bucket.end).filter(d => d <= todayStr);
      const weekStartsInMonth = new Set<string>();
      for (const d of monthDays) {
        weekStartsInMonth.add(getWeekDates(d, weekStartsOn)[0]);
      }
      let completed = 0;
      let target = 0;
      for (const weekStart of weekStartsInMonth) {
        if (habitFilter.createdAt > addDays(weekStart, 6)) continue;
        target += 1;
        if (isHabitCompleted(habitFilter, entries, weekStart, weekStartsOn, analyticsOptions)) completed += 1;
      }
      const avgPct = target > 0 ? (completed / target) * 100 : undefined;
      return { completed, target, averagePercent: avgPct };
    }

    const rawDays = bucket.dates ?? datesInRange(bucket.start, bucket.end);
    const days = rawDays.filter(d => d <= todayStr);
    let completed = 0;
    let target = 0;
    const dailyPcts: number[] = [];

    for (const d of days) {
      if (habitFilter) {
        if (habitFilter.createdAt > d) continue;
        target += 1;
        const completedThisDay = isHabitCompleted(habitFilter, entries, d, weekStartsOn, analyticsOptions);
        if (completedThisDay) completed += 1;
        const value = getHabitCurrentValue(habitFilter, entries, d, weekStartsOn, analyticsOptions);
        const t = habitFilter.target || 1;
        if (habitFilter.goalType === 'break') {
          dailyPcts.push(completedThisDay ? 100 : 0);
        } else {
          dailyPcts.push(Math.min(100, Math.round((value / t) * 100)));
        }
      } else {
        const active = habits.filter(h => isHabitActiveOnDate(h, d) && h.createdAt <= d);
        const n = active.length;
        const c = active.filter(h => isHabitCompleted(h, entries, d, weekStartsOn, analyticsOptions)).length;
        target += n;
        completed += c;
        dailyPcts.push(n > 0 ? (c / n) * 100 : 0);
      }
    }

    const avgPct =
      dailyPcts.length > 0
        ? dailyPcts.reduce((a, b) => a + b, 0) / dailyPcts.length
        : undefined;

    return { completed, target, averagePercent: avgPct };
  });
}

function computePercent(completed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((completed / target) * 100));
}

/** Clamp percent to [0, 100] for rendering. Bars must never extend below baseline. */
function safePercent(percent: number | null | undefined): number {
  const n = Number(percent);
  if (n !== n) return 0;
  return Math.max(0, Math.min(100, n));
}

function buildChartBars(habits: Habit[], entries: HabitEntry[], range: TimeRange, endDate: string, habitFilter: Habit | null, weekStartsOn: 0 | 1, t: TFunction): ChartBar[] {
  /** Weekly habits use week buckets for day/week/month/6month; year uses monthly buckets like other habits. */
  const useWeekBuckets = habitFilter?.frequency === 'weekly' && range !== 'year';
  const buckets = getBuckets(range, endDate, weekStartsOn, t, useWeekBuckets);
  const agg = aggregateCompletions(habits, entries, buckets, habitFilter, weekStartsOn, endDate);
  const bars = buckets.map((b, i) => {
    const raw =
      agg[i].averagePercent != null
        ? agg[i].averagePercent
        : computePercent(agg[i].completed, agg[i].target);
    return {
      key: b.key,
      label: b.label,
      percent: safePercent(raw),
      completed: agg[i].completed,
      target: agg[i].target,
    };
  });
  if (__DEV__ && range === 'week' && bars.length > 0) {
    const lines = bars.map(b => `${b.key} completed=${b.completed} target=${b.target} → ${b.percent}%`).join('\n');
    // eslint-disable-next-line no-console
    console.log('[Analytics weekly chart] per-day:\n' + lines);
  }
  return bars;
}

function getPeriodDates(range: TimeRange, todayStr: string, weekStartsOn: 0 | 1): string[] {
  switch (range) {
    case 'day': return [todayStr];
    case 'week': return getLast7Days(todayStr);
    case 'month': return datesInRange(addDays(todayStr, -29), todayStr);
    case '6month': {
      const start = addMonths(todayStr, -5);
      const [y, m] = start.split('-').map(Number);
      return datesInRange(`${y}-${String(m).padStart(2, '0')}-01`, todayStr);
    }
    case 'year': {
      const start = addMonths(todayStr, -11);
      const [y, m] = start.split('-').map(Number);
      return datesInRange(`${y}-${String(m).padStart(2, '0')}-01`, todayStr);
    }
  }
}

function getPeriodLabel(range: TimeRange, t: TFunction, isWeeklyHabit = false): string {
  if (isWeeklyHabit) {
    return {
      day: t('analytics.periodLabelDay'),
      week: t('analytics.periodLabel7Weeks'),
      month: t('analytics.periodLabel4Weeks'),
      '6month': t('analytics.periodLabel26Weeks'),
      year: t('analytics.periodLabel52Weeks'),
    }[range];
  }
  return {
    day: t('analytics.periodLabelDay'),
    week: t('analytics.periodLabelWeek'),
    month: t('analytics.periodLabelMonth'),
    '6month': t('analytics.periodLabel6Month'),
    year: t('analytics.periodLabelYear'),
  }[range];
}

/** Per-weekday average completion (0–6 = first day of week .. last). For month/6M/year only. Only counts dates <= todayStr. */
function getCompletionByWeekday(
  periodDates: string[],
  habits: Habit[],
  entries: HabitEntry[],
  weekStartsOn: 0 | 1,
  habitFilter: Habit | null,
  todayStr: string,
): number[] {
  const opts = { maxDate: todayStr };
  const byDow: number[][] = [[], [], [], [], [], [], []];
  if (habitFilter) {
    const t = habitFilter.target || 1;
    for (const d of periodDates) {
      if (habitFilter.createdAt > d) continue;
      const col = getDayOfWeekColumnIndex(d, weekStartsOn);
      const value = getHabitCurrentValue(habitFilter, entries, d, weekStartsOn, opts);
      const pct = Math.min(100, Math.round((value / t) * 100));
      byDow[col].push(pct);
    }
  } else {
    for (const d of periodDates) {
      const col = getDayOfWeekColumnIndex(d, weekStartsOn);
      const pct = dailyCompletion(habits, entries, d, weekStartsOn, opts);
      byDow[col].push(pct);
    }
  }
  return byDow.map(arr =>
    arr.length === 0 ? 0 : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
  );
}

// ─── X-axis ticks and labels (Apple Health–style: sparse for month, single-letter for year) ───

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] as const;

/** Indices of buckets that should show an x-axis label. Month / 26W / 1Y (week buckets): none (only range caption). */
function getXAxisTicks(range: TimeRange, bars: ChartBar[], useWeekBuckets = false): number[] {
  if (range === 'month') return [];
  if (range === 'week' || range === '6month' || range === 'year') {
    if (useWeekBuckets && (range === '6month' || range === 'year')) return [];
    return bars.map((_, i) => i);
  }
  return [];
}

/** Label text for the x-axis at this bucket. Single line, no wrap. */
function formatXAxisLabel(range: TimeRange, bar: ChartBar, index: number): string {
  if (range === 'week') return bar.label;
  if (range === 'month') return bar.label;
  if (range === '6month') return bar.label;
  if (range === 'year') {
    const [, mm] = bar.key.split('-');
    const m = parseInt(mm, 10);
    return MONTH_INITIALS[m - 1] ?? bar.label;
  }
  return bar.label;
}

/** Indices where a vertical gridline should be drawn. Month only; year has no gridlines. */
function getVerticalGridlineIndices(range: TimeRange, bars: ChartBar[]): number[] {
  if (range === 'month') return getXAxisTicks(range, bars);
  return [];
}

/** Compute streak: consecutive days ending today/yesterday with 100% completion */
function computeStreak(habits: Habit[], entries: HabitEntry[], todayStr: string, weekStartsOn: 0 | 1): number {
  if (habits.length === 0) return 0;
  let streak = 0;
  let cursor = todayStr;
  if (dailyCompletion(habits, entries, cursor, weekStartsOn) < 100) cursor = addDays(cursor, -1);
  while (cursor >= '2020-01-01') {
    if (dailyCompletion(habits, entries, cursor, weekStartsOn) === 100) {
      streak++;
      cursor = addDays(cursor, -1);
    } else break;
  }
  return streak;
}

/** Streak for a single habit. Only counts completion up to today (no future). */
function computeHabitStreak(habit: Habit, entries: HabitEntry[], todayStr: string, weekStartsOn: 0 | 1): number {
  const dates = datesInRange(habit.createdAt, todayStr);
  const opts = { maxDate: todayStr };
  let streak = 0;
  let startIdx = dates.length - 1;
  if (!isHabitCompleted(habit, entries, dates[startIdx], weekStartsOn, opts)) startIdx--;
  for (let i = startIdx; i >= 0; i--) {
    if (isHabitCompleted(habit, entries, dates[i], weekStartsOn, opts)) streak++;
    else break;
  }
  return streak;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const { habits, entries, focusKey } = useHabitLogs();
  const allHabits = useHabitStore(s => s.habits);
  const weekStartsOn = useSettingsStore(s => s.weekStartsOn);
  const todayStr = today();

  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const selectedHabit = useMemo(
    () => habits.find(h => h.id === selectedHabitId) ?? null,
    [habits, selectedHabitId],
  );

  const periodDates = useMemo(
    () => getPeriodDates(timeRange, todayStr, weekStartsOn),
    [timeRange, todayStr, weekStartsOn],
  );

  /** When a weekly habit is selected, period as week-start dates for the ring and counts */
  const periodWeekStarts = useMemo(() => {
    if (!selectedHabit || selectedHabit.frequency !== 'weekly') return null;
    const [nWeeks] =
      timeRange === 'week' ? [7] : timeRange === 'month' ? [4] : timeRange === '6month' ? [26] : timeRange === 'year' ? [52] : [0];
    if (nWeeks === 0) return null;
    const weeks = getWeeksRange(nWeeks - 1, 0, weekStartsOn);
    return weeks.map(w => w[0]);
  }, [timeRange, weekStartsOn, selectedHabit]);

  React.useEffect(() => {
    if (__DEV__ && timeRange === 'week' && periodDates.length > 0) {
      const start = periodDates[0];
      const end = periodDates[periodDates.length - 1];
      // eslint-disable-next-line no-console
      console.log('[Analytics last 7 days]', { today: todayStr, start, end, days: periodDates, weekStartsOn });
    }
  }, [timeRange, periodDates, todayStr, weekStartsOn]);

  // ── Completion ring ───────────────────────────────────────────────────────

  const analyticsOptions = useMemo(() => ({ maxDate: todayStr }), [todayStr]);
  const { completionPct, completionText, completionTitle } = useMemo(() => {
    if (selectedHabit) {
      const useWeeks = selectedHabit.frequency === 'weekly' && periodWeekStarts != null;
      const rawDates = useWeeks ? periodWeekStarts : periodDates;
      const dates = useWeeks
        ? rawDates.filter(ws => selectedHabit.createdAt <= addDays(ws, 6))
        : rawDates.filter(d => selectedHabit.createdAt <= d);
      const completed = dates.filter(d => isHabitCompleted(selectedHabit, entries, d, weekStartsOn, analyticsOptions)).length;
      const total = dates.length;
      return {
        completionPct:   total > 0 ? Math.round((completed / total) * 100) : 0,
        completionText:  useWeeks
          ? t('analytics.weeksCompletion', { completed: String(completed), total: String(total) })
          : t('analytics.sessionsCompletion', { completed: String(completed), total: String(total) }),
        completionTitle: t('analytics.habitCompletion', { name: selectedHabit.name }),
      };
    }
    if (allHabits.length === 0) return { completionPct: 0, completionText: t('analytics.zeroHabits'), completionTitle: getPeriodLabel(timeRange, t) };
    const scores   = periodDates.map(d => dailyCompletion(allHabits, entries, d, weekStartsOn, analyticsOptions));
    const pct      = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
    let totalPossible = 0;
    for (const d of periodDates) {
      totalPossible += allHabits.filter(h => isHabitActiveOnDate(h, d) && h.createdAt <= d).length;
    }
    let totalCompleted = 0;
    for (const d of periodDates) {
      const active = allHabits.filter(h => isHabitActiveOnDate(h, d) && h.createdAt <= d);
      totalCompleted += active.filter(h => isHabitCompleted(h, entries, d, weekStartsOn, analyticsOptions)).length;
    }
    return {
      completionPct:   pct,
      completionText:  t('analytics.habitsCompletion', { completed: String(totalCompleted), total: String(totalPossible) }),
      completionTitle: getPeriodLabel(timeRange, t) + ' ' + t('analytics.completionSuffix'),
    };
  }, [selectedHabit, allHabits, entries, periodDates, periodWeekStarts, timeRange, weekStartsOn, analyticsOptions, focusKey, t]);

  const chartBars = useMemo(
    () => buildChartBars(allHabits, entries, timeRange, todayStr, selectedHabit ?? null, weekStartsOn, t),
    [allHabits, entries, timeRange, todayStr, selectedHabit, weekStartsOn, focusKey, t],
  );

  const totalCompleted = useMemo(
    () => chartBars.reduce((s, b) => s + b.completed, 0),
    [chartBars],
  );
  const barSectionTitle = selectedHabit ? t('analytics.habitCompletion', { name: selectedHabit.name }) : t('analytics.habitsCompleted');
  const hasChartData = chartBars.some(b => b.target > 0);

  const useWeekBuckets = selectedHabit?.frequency === 'weekly';
  const xAxisTickIndices = useMemo(
    () => new Set(getXAxisTicks(timeRange, chartBars, useWeekBuckets)),
    [timeRange, chartBars, useWeekBuckets],
  );
  const verticalGridlineIndices = useMemo(() => new Set(getVerticalGridlineIndices(timeRange, chartBars)), [timeRange, chartBars]);

  // ── Single-habit streak ───────────────────────────────────────────────────

  const habitStreak = useMemo(
    () => selectedHabit ? computeHabitStreak(selectedHabit, entries, todayStr, weekStartsOn) : null,
    [selectedHabit, entries, todayStr, weekStartsOn, focusKey],
  );

  const habitDaysCompleted = useMemo(() => {
    if (!selectedHabit) return null;
    if (selectedHabit.frequency === 'weekly' && periodWeekStarts != null) {
      return periodWeekStarts.filter(d => isHabitCompleted(selectedHabit, entries, d, weekStartsOn, analyticsOptions)).length;
    }
    return periodDates.filter(
      d => selectedHabit.createdAt <= d && isHabitCompleted(selectedHabit, entries, d, weekStartsOn, analyticsOptions),
    ).length;
  }, [selectedHabit, entries, periodDates, periodWeekStarts, weekStartsOn, analyticsOptions, focusKey]);

  // ── By-habit completion (when "All habits" selected) ──────────────────────
  // Uses each habit's measure: period sum of value vs expected (target × periods). Only counts up to today (no future).
  const byHabitStats = useMemo(() => {
    if (selectedHabit || habits.length === 0) return { build: [], break: [] };
    const opts = { maxDate: todayStr };
    const list = habits
      .filter(h => periodDates.some(d => isHabitActiveOnDate(h, d) && h.createdAt <= d))
      .map(habit => {
        const isBreak = habit.goalType === 'break';
        const targetPerPeriod = habit.target || 1;
        const unit = habit.unit?.trim() || 'sessions';

        if (habit.frequency === 'daily') {
          const eligible = periodDates.filter(d => isHabitActiveOnDate(habit, d) && habit.createdAt <= d);
          const value = eligible.reduce((sum, d) => sum + entryValue(entries, habit.id, d), 0);
          const expected = targetPerPeriod * eligible.length;
          const pct = expected > 0 ? Math.min(100, Math.round((value / expected) * 100)) : 0;
          const displayPct = isBreak ? (value <= expected ? 100 : Math.min(100, Math.round((value / expected) * 100))) : pct;
          return { habit, value, expected, pct: displayPct, label: `${value}/${expected} ${unit}` };
        }

        if (habit.frequency === 'weekly') {
          const weekKeys = new Set<string>();
          for (const d of periodDates) {
            if (!isHabitActiveOnDate(habit, d) || habit.createdAt > d) continue;
            weekKeys.add(getWeekDates(d, weekStartsOn)[0]);
          }
          let value = 0;
          for (const weekStart of weekKeys) {
            const anyDay = getWeekDates(weekStart, weekStartsOn).find(d => periodDates.includes(d) && isHabitActiveOnDate(habit, d) && habit.createdAt <= d);
            if (anyDay) value += getHabitCurrentValue(habit, entries, anyDay, weekStartsOn, opts);
          }
          const expected = targetPerPeriod * weekKeys.size;
          const pct = expected > 0 ? Math.min(100, Math.round((value / expected) * 100)) : 0;
          const displayPct = isBreak ? (value <= expected ? 100 : Math.min(100, Math.round((value / expected) * 100))) : pct;
          return { habit, value, expected, pct: displayPct, label: `${value}/${expected} ${unit}` };
        }

        // monthly: sum value per month in period, expected = target × months
        const monthKeys = new Set<string>();
        for (const d of periodDates) {
          if (!isHabitActiveOnDate(habit, d) || habit.createdAt > d) continue;
          monthKeys.add(getMonthKey(d));
        }
        let value = 0;
        for (const monthKey of monthKeys) {
          const [y, m] = monthKey.split('-').map(Number);
          const lastDay = new Date(y, m, 0).getDate();
          const anchor = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          value += getHabitCurrentValue(habit, entries, anchor, weekStartsOn, opts);
        }
        const expected = targetPerPeriod * monthKeys.size;
        const pct = expected > 0 ? Math.min(100, Math.round((value / expected) * 100)) : 0;
        const displayPct = isBreak ? (value <= expected ? 100 : Math.min(100, Math.round((value / expected) * 100))) : pct;
        return { habit, value, expected, pct: displayPct, label: `${value}/${expected} ${unit}` };
      });
    const build = list.filter(x => x.habit.goalType !== 'break').sort((a, b) => b.pct - a.pct);
    const breakList = list.filter(x => x.habit.goalType === 'break').sort((a, b) => b.pct - a.pct);
    return { build, break: breakList };
  }, [habits, periodDates, entries, selectedHabit, weekStartsOn, todayStr, focusKey]);

  // ── Completion by weekday (month / 6M / year only) ─────────────────────────
  const completionByWeekday = useMemo(() => {
    if (timeRange !== 'month' && timeRange !== '6month' && timeRange !== 'year') return null;
    return getCompletionByWeekday(periodDates, allHabits, entries, weekStartsOn, selectedHabit, todayStr);
  }, [timeRange, periodDates, allHabits, entries, weekStartsOn, selectedHabit, todayStr, focusKey]);

  // ── Break habits summary ───────────────────────────────────────────────────
  const breakHabitsSummary = useMemo(() => {
    if (selectedHabit || !habits.some(h => h.goalType === 'break')) return null;
    const breakHabits = habits.filter(h => h.goalType === 'break');
    const opts = { maxDate: todayStr };
    let daysWithBreak = 0;
    let daysUnderLimit = 0;
    for (const d of periodDates) {
      const active = breakHabits.filter(h => isHabitActiveOnDate(h, d) && h.createdAt <= d);
      if (active.length === 0) continue;
      daysWithBreak++;
      const over = active.some(h => {
        const val = getHabitCurrentValue(h, entries, d, weekStartsOn, opts);
        return val > h.target;
      });
      if (!over) daysUnderLimit++;
    }
    return daysWithBreak > 0 ? { daysUnderLimit, daysWithBreak } : null;
  }, [habits, periodDates, entries, selectedHabit, weekStartsOn, todayStr, focusKey]);

  // ── Heatmap (current month) ───────────────────────────────────────────────

  const { colors } = useTheme();
  const heatmapData = useMemo(() => {
    const [y, m] = todayStr.split('-').map(Number);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const lastDay  = new Date(y, m, 0).getDate();
    const cells: { dateStr: string | null; color: string }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ dateStr: null, color: 'transparent' });
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const future  = dateStr > todayStr;
      let pct = 0;
      if (!future) {
        if (selectedHabit) {
          const val = getHabitCurrentValue(selectedHabit, entries, dateStr, weekStartsOn);
          pct = Math.round((val / (selectedHabit.target || 1)) * 100);
        } else {
          pct = dailyCompletion(habits, entries, dateStr, weekStartsOn);
        }
      }
      let color = colors.heatmapEmpty;
      if (future) color = colors.heatmapFuture;
      else if (pct >= 70) color = colors.heatmapSuccess;
      else if (pct >= 50) color = colors.heatmapWarning;
      else if (pct >= 30) color = colors.heatmapWarningLight;
      cells.push({ dateStr, color });
    }
    while (cells.length % 7 !== 0) cells.push({ dateStr: null, color: 'transparent' });
    const rows: { dateStr: string | null; color: string }[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [todayStr, selectedHabit, habits, entries, weekStartsOn, focusKey, colors]);

  const heatmapMonthLabel = format(new Date(todayStr + 'T00:00:00'), 'MMM', { locale: getDateLocale() });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgAnalytics }]} edges={['top']}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={[s.headerTitle, { color: colors.text1 }]}>{t('analytics.title')}</Text>

        {/* Habit pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pillsRow}
        >
          <Pill
            label={t('analytics.allHabits')}
            active={selectedHabitId === 'all'}
            onPress={() => setSelectedHabitId('all')}
            colors={colors}
          />
          {habits.map(h => (
            <Pill
              key={h.id}
              label={h.name}
              icon={h.icon}
              active={selectedHabitId === h.id}
              onPress={() => setSelectedHabitId(h.id)}
              colors={colors}
            />
          ))}
        </ScrollView>

        {/* Time range: 7D / 30D / 6M / Y — history only (no future days) */}
        <View style={[s.timeRangeRow, { backgroundColor: colors.separatorLight }]}>
          {(['week', 'month', '6month', 'year'] as TimeRange[]).map(r => (
            <Pressable
              key={r}
              onPress={() => setTimeRange(r)}
              style={[s.timeRangeSeg, timeRange === r && [s.timeRangeSegActive, { backgroundColor: colors.bgCard }]]}
            >
              <Text style={[s.timeRangeSegText, { color: colors.text2 }, timeRange === r && { color: colors.text1 }]}>
                {selectedHabit?.frequency === 'weekly' && r !== 'year'
                  ? (r === 'week' ? t('analytics.timeRange7W') : r === 'month' ? t('analytics.timeRange4W') : t('analytics.timeRange26W'))
                  : (r === 'week' ? t('analytics.timeRange7D') : r === 'month' ? t('analytics.timeRange30D') : r === '6month' ? t('analytics.timeRange6M') : t('analytics.timeRangeY'))}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Completion ring card ───────────────────────────────────── */}
        <View style={[s.completionCard, { backgroundColor: colors.bgCard }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.completionTitle, { color: colors.text1 }]}>{completionTitle}</Text>
            <Text style={[s.completionSub, { color: colors.text2 }]}>{completionText}{'\n'}{t('analytics.completedWord')}</Text>
          </View>
          <View style={s.completionRingWrap}>
            <ScoreRing
              value={completionPct}
              size={130}
              strokeWidth={14}
              radius={50}
              animationSlot="analytics"
              labelStyle={s.ringPct}
              labelStyleWhenFull={s.ringPctFull}
            />
          </View>
        </View>

        {/* ── Bar chart ─────────────────────────────────────────────── */}
        <Text style={[s.sectionTitle, { color: colors.text1 }]}>{barSectionTitle}</Text>
        <View style={[s.barCard, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.barTotal, { color: colors.text1 }]}>{totalCompleted}</Text>
          <Text style={[s.barTotalLabel, { color: colors.text2 }]}>{t('analytics.totalCompletedHabits')}</Text>
          {!hasChartData ? (
            <View style={s.barEmpty}>
              <Text style={[s.barEmptyText, { color: colors.text2 }]}>{t('analytics.noDataForPeriod')}</Text>
            </View>
          ) : (
            <>
              <BarChartWithTooltip
                bars={chartBars}
                chartAreaHeight={timeRange === 'month' ? 240 : 220}
                getTooltipDateLabel={(bar) =>
                  timeRange === 'month' || timeRange === 'week'
                    ? format(new Date(bar.key + 'T00:00:00'), 'EEE, MMM d', { locale: getDateLocale() })
                    : bar.label
                }
                todayIndex={timeRange === 'week' ? chartBars.length - 1 : null}
                emptyMessage={t('analytics.noDataForPeriod')}
                renderTopContent={
                  timeRange === 'month'
                    ? layout => (
                        <ChartGridlines
                          range={timeRange}
                          barCount={chartBars.length}
                          chartWidth={layout.width}
                          chartHeight={240}
                          gridlineIndices={verticalGridlineIndices}
                        />
                      )
                    : undefined
                }
                barChartRowMonth={timeRange === 'month'}
                xAxisTickIndices={xAxisTickIndices}
                getAxisLabel={timeRange === 'year' ? (bar) => {
                  const [, mm] = bar.key.split('-');
                  const m = parseInt(mm, 10);
                  return MONTH_INITIALS[m - 1] ?? bar.label;
                } : undefined}
              />
              {(timeRange === 'month' || (useWeekBuckets && (timeRange === '6month' || timeRange === 'year'))) && chartBars.length >= 2 && (() => {
                const start = chartBars[0].key;
                const lastWeekStart = chartBars[chartBars.length - 1].key;
                const end = useWeekBuckets ? addDays(lastWeekStart, 6) : lastWeekStart;
                const fmt = (d: string) => format(new Date(d + 'T00:00:00'), 'MMM d', { locale: getDateLocale() });
                return (
                  <Text style={[s.barChartRangeCaption, { color: colors.text2 }]}>{fmt(start)} – {fmt(end)}</Text>
                );
              })()}
            </>
          )}
        </View>

        {/* ── By habit (when "All habits" selected) ───────────────────────────── */}
        {!selectedHabit && (byHabitStats.build.length > 0 || byHabitStats.break.length > 0) && (
          <>
            <Text style={[s.sectionTitle, { color: colors.text1 }]}>{t('analytics.byHabit')}</Text>
            <View style={[s.byHabitCard, { backgroundColor: colors.bgCard }]}>
              {byHabitStats.build.length > 0 && (
                <>
                  <Text style={[s.byHabitSubtitle, { color: colors.text2 }]}>{t('analytics.buildHabits')}</Text>
                  {byHabitStats.build.slice(0, 12).map(({ habit, pct, label }) => (
                    <View key={habit.id} style={s.byHabitRow}>
                      <Text style={s.byHabitIcon}>{habit.icon}</Text>
                      <View style={s.byHabitCenter}>
                        <View style={s.byHabitNameRow}>
                          <Text style={[s.byHabitName, { color: colors.text1 }]} numberOfLines={1}>{habit.name}</Text>
                          <Text style={[s.byHabitDays, { color: colors.text2 }]}>{label}</Text>
                        </View>
                        <View style={[s.byHabitBarBg, { backgroundColor: colors.ring }]}>
                          <View style={[s.byHabitBarFill, { width: `${Math.min(100, pct)}%`, backgroundColor: colors.success }]} />
                        </View>
                      </View>
                      <Text style={[s.byHabitPct, { color: colors.text1 }]}>{pct}%</Text>
                    </View>
                  ))}
                </>
              )}
              {byHabitStats.break.length > 0 && (
                <>
                  <Text style={[s.byHabitSubtitle, { color: colors.text2 }, byHabitStats.build.length > 0 && s.byHabitSubtitleSpaced]}>{t('analytics.breakHabits')}</Text>
                  {byHabitStats.break.slice(0, 12).map(({ habit, pct, label }) => (
                    <View key={habit.id} style={s.byHabitRow}>
                      <Text style={s.byHabitIcon}>{habit.icon}</Text>
                      <View style={s.byHabitCenter}>
                        <View style={s.byHabitNameRow}>
                          <Text style={[s.byHabitName, { color: colors.text1 }]} numberOfLines={1}>{habit.name}</Text>
                          <Text style={[s.byHabitDays, { color: colors.text2 }]}>{label}</Text>
                        </View>
                        <View style={[s.byHabitBarBg, { backgroundColor: colors.ring }]}>
                          <View style={[s.byHabitBarFillBreak, { width: `${Math.min(100, pct)}%`, backgroundColor: colors.success }]} />
                        </View>
                      </View>
                      <Text style={[s.byHabitPct, { color: colors.text1 }]}>{pct}%</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </>
        )}

        {/* ── Completion by weekday (Month / 6M / Year) ──────────────────────── */}
        {completionByWeekday !== null && (
          <>
            <Text style={[s.sectionTitle, { color: colors.text1 }]}>{t('analytics.completionByWeekday')}</Text>
            <View style={[s.weekdayCard, { backgroundColor: colors.bgCard }]}>
              {getShortDayLabels(weekStartsOn).map((label, i) => {
                const pct = completionByWeekday[i] ?? 0;
                return (
                  <View key={i} style={s.weekdayRow}>
                    <Text style={[s.weekdayLabel, { color: colors.text2 }]} numberOfLines={1}>{label}</Text>
                    <View style={[s.weekdayBarBg, { backgroundColor: colors.ring }]}>
                      <View style={[s.weekdayBarFill, { width: `${pct}%`, backgroundColor: colors.success }]} />
                    </View>
                    <Text style={[s.weekdayPct, { color: colors.text1 }]} numberOfLines={1}>{`${pct}%`}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Break habits summary ───────────────────────────────────────────── */}
        {breakHabitsSummary !== null && (
            <View style={[s.breakSummaryCard, { backgroundColor: colors.successSoft }]}>
            <Text style={[s.breakSummaryText, { color: colors.text1 }]}>
              {t('analytics.stayedUnderLimit', { under: String(breakHabitsSummary.daysUnderLimit), total: String(breakHabitsSummary.daysWithBreak) })}
            </Text>
          </View>
        )}

        {/* ── Streak card (single habit only) ───────────────────────── */}
        {selectedHabit && habitStreak !== null && habitDaysCompleted !== null && (
          <View style={[s.streakCard, { backgroundColor: colors.bgCard }]}>
            <View style={s.streakItem}>
              <View style={[s.streakIconOrange, { backgroundColor: colors.warningSoft }]}>
                <Flame size={24} color={colors.warning} strokeWidth={2} />
              </View>
              <Text style={[s.streakNum, { color: colors.text1 }]}>{habitStreak}</Text>
              <Text style={[s.streakLabel, { color: colors.text2 }]}>{t('analytics.currentStreak')}</Text>
            </View>
            <View style={s.streakItem}>
              <View style={[s.streakIconGreen, { backgroundColor: colors.successSoft }]}>
                <CalendarCheck size={24} color={colors.success} strokeWidth={2} />
              </View>
              <Text style={[s.streakNum, { color: colors.text1 }]}>{habitDaysCompleted}</Text>
              <Text style={[s.streakLabel, { color: colors.text2 }]}>{selectedHabit.frequency === 'weekly' ? t('analytics.weeksCompleted') : t('analytics.daysCompleted')}</Text>
            </View>
          </View>
        )}

        {/* ── Heatmap (Month only) ───────────────────────────────────────────── */}
        {timeRange === 'month' && (
          <>
            <View style={s.heatmapHeader}>
              <Text style={[s.sectionTitle, { color: colors.text1 }]}>{t('analytics.habitHeatmap')}</Text>
              <View style={[s.heatmapMonthPill, { backgroundColor: colors.separatorLight }]}>
                <Text style={[s.heatmapMonthText, { color: colors.text2 }]}>{heatmapMonthLabel}</Text>
              </View>
            </View>
            <View style={[s.heatmapCard, { backgroundColor: colors.bgCard }]}>
              <View style={s.heatDayRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => (
                  <Text key={i} style={[s.heatDayLabel, { color: colors.text2 }]}>{l}</Text>
                ))}
              </View>
              {heatmapData.map((row, ri) => (
                <View key={ri} style={s.heatRow}>
                  {row.map((cell, ci) => (
                    <View
                      key={ci}
                      style={[s.heatCell, { backgroundColor: cell.color }]}
                    />
                  ))}
                </View>
              ))}
              <View style={s.legend}>
                <Text style={[s.legendLabel, { color: colors.text2 }]}>Less</Text>
                {[colors.heatmapLow, colors.heatmapWarningLight, colors.heatmapWarning, colors.heatmapSuccess].map((c, i) => (
                  <View key={i} style={[s.legendCell, { backgroundColor: c }]} />
                ))}
                <Text style={[s.legendLabel, { color: colors.text2 }]}>More</Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartGridlines({
  range,
  barCount,
  chartWidth,
  chartHeight,
  gridlineIndices,
}: {
  range: TimeRange;
  barCount: number;
  chartWidth: number;
  chartHeight: number;
  gridlineIndices: Set<number>;
}) {
  if (chartWidth <= 0 || barCount <= 0) return null;
  const step = chartWidth / barCount;
  const stroke = 'rgba(0,0,0,0.06)';
  return (
    <View style={[StyleSheet.absoluteFill, s.chartGridlinesWrap, { height: chartHeight }]} pointerEvents="none">
      <Svg width={chartWidth} height={chartHeight} style={s.chartGridlinesSvg}>
        {Array.from(gridlineIndices).map(i => {
          const x = i * step;
          return (
            <Line
              key={i}
              x1={x}
              y1={0}
              x2={x}
              y2={chartHeight}
              stroke={stroke}
              strokeWidth={1}
            />
          );
        })}
      </Svg>
    </View>
  );
}

function Pill({
  label, icon, active, onPress, colors,
}: {
  label: string; icon?: string; active: boolean; onPress: () => void; colors: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.pill, { backgroundColor: colors.separatorLight }, active && [s.pillActive, { backgroundColor: colors.tealSoft }]]}
    >
      {icon && <Text style={s.pillIcon}>{icon}</Text>}
      <Text style={[s.pillText, { color: colors.text2 }, active && { color: colors.teal, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F9F9F9' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 20 },

  // Header
  header:      { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  headerTitle: {
    fontSize: 34, fontWeight: '700', color: '#1A1A1A',
    letterSpacing: -0.68, marginBottom: 20,
  },
  pillsRow:    { gap: 8, paddingBottom: 4 },
  timeRangeRow: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#EFEFEF',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  timeRangeSeg: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  timeRangeSegActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  timeRangeSegText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  timeRangeSegTextActive: { color: '#1A1A1A' },
  pill:        {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 50, backgroundColor: '#EFEFEF',
  },
  pillActive:  { backgroundColor: 'rgba(0, 128, 128, 0.12)' },
  pillIcon:    { fontSize: 14 },
  pillText:    { fontSize: 15, fontWeight: '500', color: '#8E8E93' },
  pillTextActive: { color: '#008080', fontWeight: '600' },

  // Completion ring card
  completionCard: {
    backgroundColor: '#fff', borderRadius: 24,
    paddingVertical: 24, paddingHorizontal: 24, marginBottom: 32,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, shadowRadius: 40, elevation: 6,
  },
  completionTitle: {
    fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 6, letterSpacing: -0.4,
  },
  completionSub: { fontSize: 17, color: '#8E8E93', lineHeight: 22 },
  completionRingWrap: {
    width: 130,
    height: 130,
    flexShrink: 0,
  },
  ringPct: { fontSize: 28, fontWeight: '700', color: '#000', letterSpacing: -0.8 },
  ringPctFull: { fontSize: 22, letterSpacing: -0.5 },

  // Bar chart
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  barCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 24, marginBottom: 32, overflow: 'visible',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  barTotal: { fontSize: 40, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.8, lineHeight: 44, marginBottom: 4 },
  barTotalLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  barEmpty: { minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  barEmptyText: { fontSize: 15, color: '#8E8E93' },
  chartGridlinesWrap: { top: 0, left: 0, right: 0, height: 220 },
  chartGridlinesSvg: { position: 'absolute', top: 0, left: 0 },
  barChartRangeCaption: { fontSize: 11, color: '#8E8E93', marginTop: 8, textAlign: 'center' },

  // By habit
  byHabitCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  byHabitSubtitle: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  byHabitSubtitleSpaced: { marginTop: 16 },
  byHabitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  byHabitIcon: { fontSize: 20, marginRight: 12, width: 28, textAlign: 'center' },
  byHabitCenter: { flex: 1, marginRight: 12 },
  byHabitNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  byHabitName: { fontSize: 15, fontWeight: '500', color: '#1A1A1A', flex: 1 },
  byHabitDays: { fontSize: 12, color: '#8E8E93', marginLeft: 8 },
  byHabitBarBg: { height: 6, backgroundColor: '#E5E5E7', borderRadius: 3, overflow: 'hidden' },
  byHabitBarFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 3 },
  byHabitBarFillBreak: { height: '100%', backgroundColor: '#34C759', borderRadius: 3 },
  byHabitPct: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', minWidth: 36, textAlign: 'right' },

  // Completion by weekday
  weekdayCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  weekdayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  weekdayLabel: { fontSize: 13, color: '#8E8E93', width: 36 },
  weekdayBarBg: { flex: 1, height: 8, backgroundColor: '#E5E5E7', borderRadius: 4, overflow: 'hidden', marginHorizontal: 12 },
  weekdayBarFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  weekdayPct: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', minWidth: 40, textAlign: 'right' },

  // Break habits summary
  breakSummaryCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)', borderRadius: 16, padding: 16, marginBottom: 32,
  },
  breakSummaryText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },

  // Streak card
  streakCard: {
    backgroundColor: '#fff', borderRadius: 20,
    paddingVertical: 24, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  streakItem:      { alignItems: 'center' },
  streakIconOrange: {
    width: 48, height: 48, borderRadius: 24, marginBottom: 12,
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  streakIconGreen: {
    width: 48, height: 48, borderRadius: 24, marginBottom: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  streakNum:   { fontSize: 48, fontWeight: '700', color: '#1A1A1A', lineHeight: 52, marginBottom: 8 },
  streakLabel: { fontSize: 15, color: '#8E8E93' },

  // Heatmap
  heatmapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  heatmapMonthPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50,
    backgroundColor: '#EFEFEF',
  },
  heatmapMonthText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  heatmapCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  heatDayRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  heatDayLabel:{ width: 32, textAlign: 'center', fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  heatRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  heatCell:    { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E5E5E7' },
  legend:      {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 6, marginTop: 24,
  },
  legendLabel: { fontSize: 11, color: '#8E8E93' },
  legendCell:  { width: 14, height: 14, borderRadius: 3 },
});
