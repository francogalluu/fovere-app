import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Flame, CalendarCheck } from 'lucide-react-native';
import { useHabitStore } from '@/store';
import { today, datesInRange, addDays, toLocalDateString } from '@/lib/dates';
import {
  dailyCompletion,
  getHabitCurrentValue,
  isHabitCompleted,
} from '@/lib/aggregates';
import { getProgressColor } from '@/lib/progressColors';
import type { Habit, HabitEntry } from '@/types/habit';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimePeriod = 'week' | 'month' | '30days' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPeriodDates(period: TimePeriod, todayStr: string, createdAt?: string): string[] {
  switch (period) {
    case 'week': {
      const d = new Date(todayStr + 'T00:00:00');
      const dow = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      return datesInRange(toLocalDateString(monday), todayStr);
    }
    case 'month': {
      const [y, m] = todayStr.split('-').map(Number);
      return datesInRange(`${y}-${String(m).padStart(2, '0')}-01`, todayStr);
    }
    case '30days':
      return datesInRange(addDays(todayStr, -29), todayStr);
    case 'all':
      return datesInRange(createdAt ?? addDays(todayStr, -89), todayStr);
  }
}

function getPeriodLabel(period: TimePeriod): string {
  return { week: 'This week', month: 'This month', '30days': 'Last 30 days', all: 'All time' }[period];
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

  const habits = useMemo(
    () => rawHabits.filter(h => h.archivedAt === null),
    [rawHabits],
  );

  const todayStr = today();

  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [period, setPeriod]                   = useState<TimePeriod>('week');

  const selectedHabit = useMemo(
    () => habits.find(h => h.id === selectedHabitId) ?? null,
    [habits, selectedHabitId],
  );

  // ── Period dates ─────────────────────────────────────────────────────────

  const periodDates = useMemo(
    () => getPeriodDates(period, todayStr, selectedHabit?.createdAt ?? habits[0]?.createdAt),
    [period, todayStr, selectedHabit, habits],
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
    if (habits.length === 0) return { completionPct: 0, completionText: '0 of 0 habits', completionTitle: getPeriodLabel(period) };
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
      completionTitle: getPeriodLabel(period) + ' completion',
    };
  }, [selectedHabit, habits, entries, periodDates, period]);

  // ── Bar chart (this-week data) ────────────────────────────────────────────

  const weekDates = useMemo(() => {
    const d = new Date(todayStr + 'T00:00:00');
    const dow = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return datesInRange(toLocalDateString(monday), todayStr);
  }, [todayStr]);

  const barData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, i) => {
      const dateStr = addDays(
        (() => {
          const d = new Date(todayStr + 'T00:00:00');
          const dow = d.getDay();
          const monday = new Date(d);
          monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
          return toLocalDateString(monday);
        })(),
        i,
      );
      const isFuture = dateStr > todayStr;
      let value = 0;
      let max   = 1;
      if (!isFuture) {
        if (selectedHabit) {
          value = getHabitCurrentValue(selectedHabit, entries, dateStr);
          max   = selectedHabit.target;
        } else {
          value = habits.filter(h => isHabitCompleted(h, entries, dateStr)).length;
          max   = habits.length || 1;
        }
      }
      return { label, value, max, isFuture, isToday: dateStr === todayStr };
    });
  }, [todayStr, selectedHabit, habits, entries]);

  const barTotal = barData.reduce((a, b) => a + b.value, 0);
  const barTotalLabel = selectedHabit
    ? `${barTotal}${selectedHabit.unit ? ' ' + selectedHabit.unit : ''} this week`
    : `${barTotal} total completed habits`;
  const barSectionTitle = selectedHabit ? `${selectedHabit.name} logged` : 'Habits completed';

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

        {/* Time period pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.pillsRow, { marginTop: 8 }]}
        >
          {(['week', 'month', '30days', 'all'] as TimePeriod[]).map(p => (
            <Pill
              key={p}
              label={getPeriodLabel(p)}
              active={period === p}
              onPress={() => setPeriod(p)}
            />
          ))}
        </ScrollView>
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
          <Text style={s.barTotal}>{barTotal}</Text>
          <Text style={s.barTotalLabel}>{barTotalLabel}</Text>
          <View style={s.barChart}>
            {barData.map((d, i) => {
              const heightPct = d.max > 0 ? Math.round((d.value / d.max) * 100) : 0;
              const actualH   = d.value > 0 ? Math.max(heightPct, 15) : 8;
              const color     = d.value > 0 ? '#34C759' : '#E8E8ED';
              return (
                <View key={i} style={s.barCol}>
                  <View style={s.barWrapper}>
                    <View
                      style={[
                        s.bar,
                        {
                          height: `${actualH}%` as any,
                          backgroundColor: color,
                          borderBottomLeftRadius: d.value > 0 ? 4 : 8,
                          borderBottomRightRadius: d.value > 0 ? 4 : 8,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[s.barLabel, d.isToday && s.barLabelToday]}>{d.label}</Text>
                </View>
              );
            })}
          </View>
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
  barTotal:      { fontSize: 40, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.8, lineHeight: 44, marginBottom: 4 },
  barTotalLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 24 },
  barChart:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 180 },
  barCol:    { flex: 1, alignItems: 'center', height: '100%' },
  barWrapper:{ flex: 1, width: '100%', justifyContent: 'flex-end', paddingBottom: 0 },
  bar:       { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barLabel:  { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 8 },
  barLabelToday: { color: '#34C759' },

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
