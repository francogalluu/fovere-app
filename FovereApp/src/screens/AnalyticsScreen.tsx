import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Animated as RNAnimated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, type SharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Line } from 'react-native-svg';
import { Flame, CalendarCheck } from 'lucide-react-native';
import { useHabitStore } from '@/store';
import {
  today,
  datesInRange,
  addDays,
  addMonths,
  getWeekDates,
  getWeekRange,
  getMonthRange,
  getDayOfWeekIndex,
  getLastNMonthRanges,
  SHORT_DAY_LABELS,
} from '@/lib/dates';
import {
  dailyCompletion,
  getHabitCurrentValue,
  isHabitCompleted,
} from '@/lib/aggregates';
import { getProgressColor } from '@/lib/progressColors';
import type { Habit, HabitEntry } from '@/types/habit';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeRange = 'day' | 'week' | 'month' | '6month' | 'year';
export type ChartBucket = { key: string; label: string; start: string; end: string };
export type ChartBar = { key: string; label: string; percent: number; completed: number; target: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBuckets(range: TimeRange, endDate: string): ChartBucket[] {
  switch (range) {
    case 'day':
      return [{ key: endDate, label: 'Today', start: endDate, end: endDate }];
    case 'week': {
      const weekDays = getWeekDates(endDate);
      return weekDays.map((d, i) => ({ key: d, label: SHORT_DAY_LABELS[i], start: d, end: d }));
    }
    case 'month': {
      const start = addDays(endDate, -29);
      return datesInRange(start, endDate).map(d => ({ key: d, label: d.split('-')[2], start: d, end: d }));
    }
    case '6month':
      return getLastNMonthRanges(endDate, 6).map(({ start, end, label, monthKey }) => ({ key: monthKey, label, start, end }));
    case 'year':
      return getLastNMonthRanges(endDate, 12).map(({ start, end, label, monthKey }) => ({ key: monthKey, label, start, end }));
  }
}

function aggregateCompletions(habits: Habit[], entries: HabitEntry[], buckets: ChartBucket[], habitFilter: Habit | null): { completed: number; target: number }[] {
  return buckets.map(bucket => {
    const days = datesInRange(bucket.start, bucket.end);
    let completed = 0, target = 0;
    for (const d of days) {
      if (habitFilter) {
        if (habitFilter.createdAt > d) continue;
        target += 1;
        if (isHabitCompleted(habitFilter, entries, d)) completed += 1;
      } else {
        const active = habits.filter(h => h.archivedAt === null && h.createdAt <= d);
        target += active.length;
        completed += active.filter(h => isHabitCompleted(h, entries, d)).length;
      }
    }
    return { completed, target };
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

function buildChartBars(habits: Habit[], entries: HabitEntry[], range: TimeRange, endDate: string, habitFilter: Habit | null): ChartBar[] {
  const buckets = getBuckets(range, endDate);
  const agg = aggregateCompletions(habits, entries, buckets, habitFilter);
  return buckets.map((b, i) => {
    const raw = computePercent(agg[i].completed, agg[i].target);
    return {
      key: b.key, label: b.label,
      percent: safePercent(raw),
      completed: agg[i].completed, target: agg[i].target,
    };
  });
}

function getPeriodDates(range: TimeRange, todayStr: string): string[] {
  switch (range) {
    case 'day': return [todayStr];
    case 'week': return getWeekDates(todayStr).filter(d => d <= todayStr);
    case 'month': return datesInRange(getMonthRange(todayStr).start, todayStr);
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

function getPeriodLabel(range: TimeRange): string {
  return { day: 'Today', week: 'This week', month: 'This month', '6month': 'Last 6 months', year: 'Last year' }[range];
}

// ─── X-axis ticks and labels (Apple Health–style: sparse for month, single-letter for year) ───

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_INITIALS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] as const;

/** Indices of buckets that should show an x-axis label. Month: no per-bar labels (only range caption). */
function getXAxisTicks(range: TimeRange, bars: ChartBar[]): number[] {
  if (range === 'month') return [];
  if (range === 'week' || range === '6month' || range === 'year') {
    return bars.map((_, i) => i);
  }
  return [];
}

/** Format date key YYYY-MM-DD as "Feb 1" (locale short month + day). */
function formatMonthDay(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Label text for the x-axis at this bucket. Single line, no wrap. */
function formatXAxisLabel(range: TimeRange, bar: ChartBar, index: number): string {
  if (range === 'week') return WEEKDAY_LABELS[index] ?? bar.label;
  if (range === 'month') return formatMonthDay(bar.key);
  if (range === '6month') return bar.label;
  if (range === 'year') {
    const [, mm] = bar.key.split('-');
    const m = parseInt(mm, 10);
    return MONTH_INITIALS[m - 1] ?? bar.label;
  }
  return bar.label;
}

/** Indices where a vertical gridline should be drawn. Month: same ~4 as x-axis labels; Year: between months. */
function getVerticalGridlineIndices(range: TimeRange, bars: ChartBar[]): number[] {
  if (range === 'month') return getXAxisTicks('month', bars);
  if (range === 'year') return bars.map((_, i) => i).filter(i => i > 0);
  return [];
}

/** Compute streak: consecutive days ending today/yesterday with 100% completion */
function computeStreak(habits: Habit[], entries: HabitEntry[], todayStr: string): number {
  if (habits.length === 0) return 0;
  let streak = 0;
  let cursor = todayStr;
  if (dailyCompletion(habits, entries, cursor) < 100) cursor = addDays(cursor, -1);
  while (cursor >= '2020-01-01') {
    if (dailyCompletion(habits, entries, cursor) === 100) {
      streak++;
      cursor = addDays(cursor, -1);
    } else break;
  }
  return streak;
}

/** Streak for a single habit */
function computeHabitStreak(habit: Habit, entries: HabitEntry[], todayStr: string): number {
  const dates = datesInRange(habit.createdAt, todayStr);
  let streak = 0;
  let startIdx = dates.length - 1;
  if (!isHabitCompleted(habit, entries, dates[startIdx])) startIdx--;
  for (let i = startIdx; i >= 0; i--) {
    if (isHabitCompleted(habit, entries, dates[i])) streak++;
    else break;
  }
  return streak;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const rawHabits = useHabitStore(s => s.habits);
  const entries   = useHabitStore(s => s.entries);

  const habits = useMemo(() => {
    const seen = new Set<string>();
    return rawHabits.filter(h => {
      if (h.archivedAt !== null || seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });
  }, [rawHabits]);

  const todayStr = today();

  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [pressedBarIndex, setPressedBarIndex] = useState<number | null>(null);
  const [chartLayout, setChartLayout] = useState({ width: 0, height: 0 });
  const [chartScreenX, setChartScreenX] = useState(0);
  const chartContainerRef = useRef<View>(null);
  const chartPointerX = useSharedValue(0);
  const sharedChartScreenX = useSharedValue(0);
  const sharedChartWidth = useSharedValue(0);
  const sharedBarSlotWidth = useSharedValue(0);
  const sharedBarCount = useSharedValue(0);
  const sharedLastReportedIndex = useSharedValue(-1);

  const selectedHabit = useMemo(
    () => habits.find(h => h.id === selectedHabitId) ?? null,
    [habits, selectedHabitId],
  );

  const periodDates = useMemo(
    () => getPeriodDates(timeRange, todayStr),
    [timeRange, todayStr],
  );

  // ── Completion ring ───────────────────────────────────────────────────────

  const { completionPct, completionText, completionTitle } = useMemo(() => {
    if (selectedHabit) {
      const completed = periodDates.filter(d => isHabitCompleted(selectedHabit, entries, d)).length;
      return {
        completionPct:   periodDates.length > 0 ? Math.round((completed / periodDates.length) * 100) : 0,
        completionText:  `${completed} of ${periodDates.length} sessions`,
        completionTitle: `${selectedHabit.name} completion`,
      };
    }
    if (habits.length === 0) return { completionPct: 0, completionText: '0 of 0 habits', completionTitle: getPeriodLabel(timeRange) };
    const scores   = periodDates.map(d => dailyCompletion(habits, entries, d));
    const pct      = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
    const totalPossible = periodDates.length * habits.length;
    let totalCompleted = 0;
    for (const d of periodDates) {
      totalCompleted += habits.filter(h => isHabitCompleted(h, entries, d)).length;
    }
    return {
      completionPct:   pct,
      completionText:  `${totalCompleted} of ${totalPossible} habits`,
      completionTitle: getPeriodLabel(timeRange) + ' completion',
    };
  }, [selectedHabit, habits, entries, periodDates, timeRange]);

  const chartBars = useMemo(
    () => buildChartBars(habits, entries, timeRange, todayStr, selectedHabit ?? null),
    [habits, entries, timeRange, todayStr, selectedHabit],
  );

  const totalCompleted = useMemo(
    () => chartBars.reduce((s, b) => s + b.completed, 0),
    [chartBars],
  );
  const barSectionTitle = selectedHabit ? `${selectedHabit.name} completion` : 'Habits completed';
  const hasChartData = chartBars.some(b => b.target > 0);

  const xAxisTickIndices = useMemo(() => new Set(getXAxisTicks(timeRange, chartBars)), [timeRange, chartBars]);
  const verticalGridlineIndices = useMemo(() => new Set(getVerticalGridlineIndices(timeRange, chartBars)), [timeRange, chartBars]);

  const barGeometry = useMemo(
    () => getBarGeometry(chartLayout.width, chartBars.length),
    [chartLayout.width, chartBars.length],
  );
  const snapChartPointerToBar = useCallback(
    (index: number) => {
      setPressedBarIndex(index);
      if (chartBars.length > 0) chartPointerX.value = barGeometry.barCenterX(index);
    },
    [chartBars.length, barGeometry],
  );
  useEffect(() => {
    sharedChartScreenX.value = chartScreenX;
    sharedChartWidth.value = chartLayout.width;
    sharedBarSlotWidth.value = barGeometry.barSlotWidth;
    sharedBarCount.value = chartBars.length;
  }, [chartScreenX, chartLayout.width, barGeometry.barSlotWidth, chartBars.length]);
  useEffect(() => {
    if (pressedBarIndex !== null && chartBars.length > 0) {
      chartPointerX.value = barGeometry.barCenterX(pressedBarIndex);
    }
  }, [pressedBarIndex, chartBars.length, barGeometry]);

  // ── Single-habit streak ───────────────────────────────────────────────────

  const habitStreak = useMemo(
    () => selectedHabit ? computeHabitStreak(selectedHabit, entries, todayStr) : null,
    [selectedHabit, entries, todayStr],
  );

  const habitDaysCompleted = useMemo(() => {
    if (!selectedHabit) return null;
    return periodDates.filter(d => isHabitCompleted(selectedHabit, entries, d)).length;
  }, [selectedHabit, entries, periodDates]);

  // ── Heatmap (current month) ───────────────────────────────────────────────

  const heatmapData = useMemo(() => {
    const [y, m] = todayStr.split('-').map(Number);
    const firstDow = new Date(y, m - 1, 1).getDay();
    const lastDay  = new Date(y, m, 0).getDate();
    // pad to full weeks
    const cells: { dateStr: string | null; color: string }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ dateStr: null, color: 'transparent' });
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const future  = dateStr > todayStr;
      let pct = 0;
      if (!future) {
        if (selectedHabit) {
          const val = getHabitCurrentValue(selectedHabit, entries, dateStr);
          pct = Math.round((val / (selectedHabit.target || 1)) * 100);
        } else {
          pct = dailyCompletion(habits, entries, dateStr);
        }
      }
      let color = '#E5E5E7';
      if (future) color = '#F2F2F7';
      else if (pct >= 70) color = '#34C759';
      else if (pct >= 50) color = '#FF9F0A';
      else if (pct >= 30) color = '#FFD60A';
      cells.push({ dateStr, color });
    }
    // pad to multiple of 7
    while (cells.length % 7 !== 0) cells.push({ dateStr: null, color: 'transparent' });
    // group into weeks (rows)
    const rows: { dateStr: string | null; color: string }[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [todayStr, selectedHabit, habits, entries]);

  const heatmapMonthLabel = new Date(todayStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Analytics</Text>

        {/* Habit pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pillsRow}
        >
          <Pill
            label="All habits"
            active={selectedHabitId === 'all'}
            onPress={() => setSelectedHabitId('all')}
          />
          {habits.map(h => (
            <Pill
              key={h.id}
              label={h.name}
              icon={h.icon}
              active={selectedHabitId === h.id}
              onPress={() => setSelectedHabitId(h.id)}
            />
          ))}
        </ScrollView>

        {/* Time range: W / M / 6M / Y (no Daily) */}
        <View style={s.timeRangeRow}>
          {(['week', 'month', '6month', 'year'] as TimeRange[]).map(r => (
            <Pressable
              key={r}
              onPress={() => setTimeRange(r)}
              style={[s.timeRangeSeg, timeRange === r && s.timeRangeSegActive]}
            >
              <Text style={[s.timeRangeSegText, timeRange === r && s.timeRangeSegTextActive]}>
                {r === 'week' ? 'W' : r === 'month' ? 'M' : r === '6month' ? '6M' : 'Y'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Completion ring card ───────────────────────────────────── */}
        <View style={s.completionCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.completionTitle}>{completionTitle}</Text>
            <Text style={s.completionSub}>{completionText}{'\n'}completed</Text>
          </View>
          <CompletionRing pct={completionPct} />
        </View>

        {/* ── Bar chart ─────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>{barSectionTitle}</Text>
        <View style={s.barCard}>
          <Text style={s.barTotal}>{totalCompleted}</Text>
          <Text style={s.barTotalLabel}>Total completed habits</Text>
          {!hasChartData ? (
            <View style={s.barEmpty}>
              <Text style={s.barEmptyText}>No data for this period</Text>
            </View>
          ) : (
            <View
              ref={chartContainerRef}
              style={s.barChartContainer}
              onLayout={e => {
                const layout = e.nativeEvent.layout;
                setChartLayout(layout);
                chartContainerRef.current?.measureInWindow((x) => setChartScreenX(x));
              }}
            >
              {(timeRange === 'month' || timeRange === 'year') && chartLayout.width > 0 && (
                <ChartGridlines
                  range={timeRange}
                  barCount={chartBars.length}
                  chartWidth={chartLayout.width}
                  chartHeight={timeRange === 'month' ? 240 : 220}
                  gridlineIndices={verticalGridlineIndices}
                />
              )}
              {pressedBarIndex !== null && chartBars[pressedBarIndex] && chartLayout.width > 0 && (
                <ChartTooltip
                  bar={chartBars[pressedBarIndex]}
                  index={pressedBarIndex}
                  chartWidth={chartLayout.width}
                  barCount={chartBars.length}
                  chartAreaHeight={timeRange === 'month' ? 240 : 220}
                  timeRange={timeRange}
                  pointerX={chartPointerX}
                  screenWidth={Dimensions.get('window').width}
                  chartScreenX={chartScreenX}
                />
              )}
              <GestureDetector
                gesture={Gesture.Pan()
                  .enabled(hasChartData && chartBars.length > 0)
                  .minDistance(8)
                  .onStart(ev => {
                    'worklet';
                    const x = ev.absoluteX - sharedChartScreenX.value;
                    const w = sharedChartWidth.value;
                    const barSlotWidth = sharedBarSlotWidth.value;
                    const barCount = sharedBarCount.value;
                    if (barSlotWidth <= 0 || barCount <= 0) return;
                    const clampedX = Math.max(0, Math.min(w, x));
                    chartPointerX.value = clampedX;
                    const idx = Math.round((x - CHART_LEFT_PADDING) / barSlotWidth);
                    const clamped = Math.max(0, Math.min(barCount - 1, idx));
                    runOnJS(setPressedBarIndex)(clamped);
                    sharedLastReportedIndex.value = clamped;
                  })
                  .onUpdate(ev => {
                    'worklet';
                    const x = ev.absoluteX - sharedChartScreenX.value;
                    const w = sharedChartWidth.value;
                    const barSlotWidth = sharedBarSlotWidth.value;
                    const barCount = sharedBarCount.value;
                    const clampedX = Math.max(0, Math.min(w, x));
                    chartPointerX.value = clampedX;
                    if (barSlotWidth <= 0 || barCount <= 0) return;
                    const idx = Math.round((x - CHART_LEFT_PADDING) / barSlotWidth);
                    const clamped = Math.max(0, Math.min(barCount - 1, idx));
                    if (clamped !== sharedLastReportedIndex.value) {
                      sharedLastReportedIndex.value = clamped;
                      runOnJS(setPressedBarIndex)(clamped);
                    }
                  })
                  .onEnd(ev => {
                    'worklet';
                    const x = ev.absoluteX - sharedChartScreenX.value;
                    const barSlotWidth = sharedBarSlotWidth.value;
                    const barCount = sharedBarCount.value;
                    if (barSlotWidth <= 0 || barCount <= 0) return;
                    const idx = Math.round((x - CHART_LEFT_PADDING) / barSlotWidth);
                    const clamped = Math.max(0, Math.min(barCount - 1, idx));
                    runOnJS(snapChartPointerToBar)(clamped);
                  })}
              >
                <View style={[s.barChartRow, timeRange === 'month' && s.barChartRowMonth]}>
                  {chartBars.map((bar, i) => (
                    <BarWithTooltip
                      key={bar.key}
                      bar={bar}
                      index={i}
                      chartAreaHeight={timeRange === 'month' ? 240 : 220}
                      axisLabel={xAxisTickIndices.has(i) ? formatXAxisLabel(timeRange, bar, i) : null}
                      isHighlighted={pressedBarIndex === i}
                      isToday={timeRange === 'week' && i === getDayOfWeekIndex(todayStr)}
                      onPressIn={() => setPressedBarIndex(i)}
                      onPressOut={() => setPressedBarIndex(null)}
                    />
                  ))}
                </View>
              </GestureDetector>
              {timeRange === 'month' && chartBars.length >= 2 && (
                <Text style={s.barChartRangeCaption}>
                  {formatMonthDay(chartBars[0].key)} — {formatMonthDay(chartBars[chartBars.length - 1].key)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Streak card (single habit only) ───────────────────────── */}
        {selectedHabit && habitStreak !== null && habitDaysCompleted !== null && (
          <View style={s.streakCard}>
            <View style={s.streakItem}>
              <View style={s.streakIconOrange}>
                <Flame size={24} color="#FF9F0A" strokeWidth={2} />
              </View>
              <Text style={s.streakNum}>{habitStreak}</Text>
              <Text style={s.streakLabel}>Current streak</Text>
            </View>
            <View style={s.streakItem}>
              <View style={s.streakIconGreen}>
                <CalendarCheck size={24} color="#34C759" strokeWidth={2} />
              </View>
              <Text style={s.streakNum}>{habitDaysCompleted}</Text>
              <Text style={s.streakLabel}>Days completed</Text>
            </View>
          </View>
        )}

        {/* ── Heatmap ───────────────────────────────────────────────── */}
        <View style={s.heatmapHeader}>
          <Text style={s.sectionTitle}>Habit heatmap</Text>
          <View style={s.heatmapMonthPill}>
            <Text style={s.heatmapMonthText}>{heatmapMonthLabel}</Text>
          </View>
        </View>
        <View style={s.heatmapCard}>
          {/* Day labels */}
          <View style={s.heatDayRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l, i) => (
              <Text key={i} style={s.heatDayLabel}>{l}</Text>
            ))}
          </View>
          {/* Grid */}
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
          {/* Legend */}
          <View style={s.legend}>
            <Text style={s.legendLabel}>Less</Text>
            {['#E5E5E7', '#FFD60A', '#FF9F0A', '#34C759'].map((c, i) => (
              <View key={i} style={[s.legendCell, { backgroundColor: c }]} />
            ))}
            <Text style={s.legendLabel}>More</Text>
          </View>
        </View>

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

const TOOLTIP_MIN_WIDTH = 120;
const TOOLTIP_GAP_PX = 8;
const TOOLTIP_PADDING_LEFT = 8;
const TOOLTIP_PADDING_RIGHT = 8;
const TOOLTIP_SAFE_MARGIN = 8;
const BUBBLE_CORNER_RADIUS = 10;
const ARROW_CORNER_CLEARANCE = 2;
/** Base size for arrow (half-width). M/Y views use smaller scale so arrow aligns with narrow bars. */
const POINTER_BASE_HALF_WIDTH = 8;
const POINTER_MIN_PADDING = 10;
/** Chart horizontal padding; bars sit in [leftPadding, chartWidth - rightPadding]. */
const CHART_LEFT_PADDING = 0;
const CHART_RIGHT_PADDING = 0;

/** Single source of truth for bar geometry. barCenterX is in chart coordinates (float, no rounding). */
function getBarGeometry(chartWidth: number, barCount: number) {
  const barSlotWidth = barCount > 0 ? (chartWidth - CHART_LEFT_PADDING - CHART_RIGHT_PADDING) / barCount : 0;
  const barCenterX = (index: number) => CHART_LEFT_PADDING + index * barSlotWidth + barSlotWidth / 2;
  return { barSlotWidth, barCenterX };
}

/** Pointer/thumb scale for dense charts: M and Y have many bars so a smaller pointer aligns visually with bar width. */
function getPointerScale(barCount: number): number {
  if (barCount <= 7) return 1.0;
  if (barCount <= 12) return 0.85;
  if (barCount <= 31) return 0.7;
  return 0.6;
}

/** Rendered bar height in px (must match BarWithTooltip logic). */
function getBarHeightPx(percent: number, plotAreaHeightPx: number): number {
  const pct = safePercent(percent);
  const targetH = pct > 0 ? Math.max(pct, 15) : 8;
  const maxBarPx = plotAreaHeightPx - 20;
  return Math.max(0, (targetH / 100) * maxBarPx);
}

function ChartTooltip({
  bar,
  index,
  chartWidth,
  barCount,
  chartAreaHeight,
  timeRange,
  pointerX,
  screenWidth,
  chartScreenX,
}: {
  bar: ChartBar;
  index: number;
  chartWidth: number;
  barCount: number;
  chartAreaHeight: number;
  timeRange: TimeRange;
  pointerX: SharedValue<number>;
  screenWidth: number;
  chartScreenX: number;
}) {
  const [tooltipSize, setTooltipSize] = useState({ width: TOOLTIP_MIN_WIDTH, height: 56 });

  const { barCenterX: getBarCenterX } = getBarGeometry(chartWidth, barCount);
  const pointerScale = getPointerScale(barCount);
  const arrowHalfWidth = POINTER_BASE_HALF_WIDTH * pointerScale;
  const arrowWidth = 2 * arrowHalfWidth;
  const arrowHeight = 6 * pointerScale;
  const width = Math.max(TOOLTIP_MIN_WIDTH, tooltipSize.width);

  const barHeightPx = getBarHeightPx(bar.percent, chartAreaHeight);
  const barTopYPx = chartAreaHeight - barHeightPx;
  const tooltipTopPx = barTopYPx - tooltipSize.height - TOOLTIP_GAP_PX - arrowHeight;

  const safeMargin = TOOLTIP_SAFE_MARGIN;
  const R = BUBBLE_CORNER_RADIUS;
  const minLeft = Math.max(0, safeMargin - chartScreenX);
  const maxLeft = screenWidth - safeMargin - width - chartScreenX;
  const minArrowCenter = R + arrowHalfWidth + ARROW_CORNER_CLEARANCE;
  const maxArrowCenter = width - R - arrowHalfWidth - ARROW_CORNER_CLEARANCE;

  const tooltipWrapperStyle = useAnimatedStyle(() => {
    const anchorX = pointerX.value;
    const left = Math.max(minLeft, Math.min(maxLeft, anchorX - width / 2));
    return { left };
  });
  const arrowStyle = useAnimatedStyle(() => {
    const anchorX = pointerX.value;
    const wrapperLeft = Math.max(minLeft, Math.min(maxLeft, anchorX - width / 2));
    const rawArrowCenter = anchorX - wrapperLeft;
    const arrowCenter = Math.max(
      minArrowCenter,
      Math.min(maxArrowCenter, rawArrowCenter),
    );
    return { left: arrowCenter - arrowHalfWidth };
  });

  const dateLabel =
    timeRange === 'month'
      ? formatMonthDay(bar.key)
      : timeRange === 'week'
        ? (WEEKDAY_LABELS[index] ?? bar.label)
        : bar.label;

  const tooltipHeight = tooltipSize.height + arrowHeight;

  return (
    <Animated.View
      style={[
        s.chartTooltipWrap,
        {
          position: 'absolute',
          top: tooltipTopPx,
          width,
          height: tooltipHeight,
          zIndex: 20,
        },
        tooltipWrapperStyle,
      ]}
      pointerEvents="none"
    >
      <View
        style={[s.chartTooltip, { width }]}
        onLayout={e => {
          const { width: w, height: h } = e.nativeEvent.layout;
          setTooltipSize(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
        }}
      >
        <Text style={s.chartTooltipDate}>{dateLabel}</Text>
        <Text style={s.chartTooltipPct}>{Math.round(safePercent(bar.percent))}%</Text>
        {bar.target > 0 && (
          <Text style={s.chartTooltipDetail}>{bar.completed} of {bar.target}</Text>
        )}
      </View>
      <Animated.View
        style={[
          s.chartTooltipPointer,
          {
            position: 'absolute',
            top: tooltipSize.height - 1,
            width: 0,
            height: 0,
            borderLeftWidth: arrowHalfWidth,
            borderRightWidth: arrowHalfWidth,
            borderTopWidth: arrowHeight,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#1A1A1A',
          },
          arrowStyle,
        ]}
      />
    </Animated.View>
  );
}

function Pill({
  label, icon, active, onPress,
}: {
  label: string; icon?: string; active: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.pill, active && s.pillActive]}
    >
      {icon && <Text style={s.pillIcon}>{icon}</Text>}
      <Text style={[s.pillText, active && s.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function BarWithTooltip({
  bar,
  index,
  chartAreaHeight = 220,
  axisLabel,
  isHighlighted,
  isToday,
  onPressIn,
  onPressOut,
}: {
  bar: ChartBar;
  index: number;
  chartAreaHeight?: number;
  axisLabel: string | null;
  isHighlighted: boolean;
  isToday: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  const MAX_BAR_PX = chartAreaHeight - 20;
  const animHeight = useRef(new RNAnimated.Value(0)).current;
  const pct = safePercent(bar.percent);
  const targetH = pct > 0 ? Math.max(pct, 15) : 8;
  const targetPx = Math.max(0, (targetH / 100) * MAX_BAR_PX);

  useEffect(() => {
    RNAnimated.timing(animHeight, {
      toValue: targetPx,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [targetPx]);

  const color = getProgressColor(Math.round(pct));
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[s.barCol, isHighlighted && s.barColHighlighted]}
    >
      <View style={[s.barWrapper, { height: chartAreaHeight }]}>
        <View style={s.barGroup}>
          <View style={s.barSpacer} />
          <RNAnimated.View
            style={[
              s.bar,
              {
                height: animHeight,
                backgroundColor: color,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                borderBottomLeftRadius: pct > 0 ? 2 : 3,
                borderBottomRightRadius: pct > 0 ? 2 : 3,
              },
            ]}
          />
        </View>
      </View>
      {axisLabel !== null ? (
        <Text style={[s.barLabel, isToday && s.barLabelToday]} numberOfLines={1}>
          {axisLabel}
        </Text>
      ) : (
        <View style={s.barLabelPlaceholder} />
      )}
    </Pressable>
  );
}

const CR = 50;
const CC = 2 * Math.PI * CR;

function CompletionRing({ pct }: { pct: number }) {
  const color  = getProgressColor(pct);
  const offset = CC * (1 - pct / 100);
  return (
    <View style={{ width: 130, height: 130, flexShrink: 0 }}>
      <Svg width={130} height={130} viewBox="0 0 130 130"
        style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={65} cy={65} r={CR} fill="none" stroke="#E5E5E7" strokeWidth={14} />
        <Circle cx={65} cy={65} r={CR} fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={CC} strokeDashoffset={offset} strokeLinecap="round" />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={s.ringPct}>{pct}%</Text>
        </View>
      </View>
    </View>
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
  ringPct: { fontSize: 30, fontWeight: '700', color: '#000', letterSpacing: -0.9 },

  // Bar chart
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 },
  barCard: {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 24, marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  barTotal: { fontSize: 40, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.8, lineHeight: 44, marginBottom: 4 },
  barTotalLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  barEmpty: { minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  barEmptyText: { fontSize: 15, color: '#8E8E93' },
  barChartContainer: { position: 'relative', width: '100%', overflow: 'visible' },
  chartGridlinesWrap: { top: 0, left: 0, right: 0, height: 220 },
  chartGridlinesSvg: { position: 'absolute', top: 0, left: 0 },
  barChartRow: { flexDirection: 'row', alignItems: 'flex-end', minHeight: 240, width: '100%' },
  barChartRowMonth: { minHeight: 260 },
  barCol:    { flex: 1, alignItems: 'center', marginHorizontal: 2 },
  barColHighlighted: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 8 },
  barWrapper:{ width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barGroup:  { width: '100%', height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barSpacer: { flex: 1, minHeight: 4 },
  bar:       { width: '75%', maxWidth: 48, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  chartTooltipWrap: {
    position: 'absolute',
    minWidth: TOOLTIP_MIN_WIDTH,
    zIndex: 20,
    alignItems: 'stretch',
  },
  chartTooltip: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: TOOLTIP_MIN_WIDTH,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  chartTooltipDate: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  chartTooltipPct: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  chartTooltipDetail: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  chartTooltipPointer: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 6,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#1A1A1A',
  },
  barLabel:  { fontSize: 11, color: '#8E8E93', fontWeight: '500', marginTop: 6 },
  barLabelPlaceholder: { height: 18, marginTop: 6 },
  barLabelToday: { color: '#34C759' },
  barChartRangeCaption: { fontSize: 11, color: '#8E8E93', marginTop: 8, textAlign: 'center' },

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
