import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Flame, CalendarCheck } from 'lucide-react-native';
import { useHabitStore } from '@/store';
import { today, datesInRange, addDays, toLocalDateString } from '@/lib/dates';
import { dailyCompletion, getHabitCurrentValue } from '@/lib/aggregates';
import { getProgressColor } from '@/lib/progressColors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
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

  const todayStr  = today();
  const todayDate = new Date(todayStr + 'T00:00:00');

  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );

  // Week starts on Monday
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(todayDate);
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return d;
  });

  // ── Monthly calendar cells ────────────────────────────────────────────────

  const monthDays = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const firstDow = new Date(y, m, 1).getDay(); // 0 = Sun
    const total    = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(isoDate(y, m, d));
    return cells;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const monthStats = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const from   = isoDate(y, m, 1);
    const lastD  = new Date(y, m + 1, 0).getDate();
    const to     = isoDate(y, m, lastD);
    const dates  = datesInRange(from, todayStr < to ? todayStr : to);
    if (dates.length === 0) return { pct: 0, completed: 0, total: 0 };
    const scores    = dates.map(d => dailyCompletion(habits, entries, d));
    const completed = scores.filter(v => v === 100).length;
    const pct       = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { pct, completed, total: dates.length };
  }, [currentMonth, habits, entries, todayStr]);

  // ── Weekly bar data ───────────────────────────────────────────────────────

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const weekDays = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDateString(d);
      return {
        label:      labels[i],
        dateStr,
        completion: dateStr <= todayStr ? dailyCompletion(habits, entries, dateStr) : 0,
        isFuture:   dateStr > todayStr,
        isToday:    dateStr === todayStr,
      };
    });
  }, [weekStart, habits, entries, todayStr]);

  const weekStats = useMemo(() => {
    const past = weekDays.filter(d => !d.isFuture);
    if (past.length === 0) return { pct: 0, completed: 0, total: 0 };
    const completed = past.filter(d => d.completion === 100).length;
    const pct       = Math.round(past.reduce((a, b) => a + b.completion, 0) / past.length);
    return { pct, completed, total: past.length };
  }, [weekDays]);

  const weekLabel = useMemo(() => {
    const s = weekStart;
    const e = weekEnd;
    if (s.getMonth() === e.getMonth()) {
      return `${s.toLocaleDateString('en-US', { month: 'short' })} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${s.toLocaleDateString('en-US', { month: 'short' })} ${s.getDate()} – ${e.toLocaleDateString('en-US', { month: 'short' })} ${e.getDate()}, ${s.getFullYear()}`;
  }, [weekStart, weekEnd]);

  // ── Streak (consecutive fully-completed days ending today/yesterday) ───────

  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    let streak = 0;
    let cursor = todayStr;
    // Grace: if today isn't 100% done yet, don't break the streak
    if (dailyCompletion(habits, entries, cursor) < 100) cursor = addDays(cursor, -1);
    while (cursor >= '2020-01-01') {
      if (dailyCompletion(habits, entries, cursor) === 100) {
        streak++;
        cursor = addDays(cursor, -1);
      } else break;
    }
    return streak;
  }, [habits, entries, todayStr]);

  // ── Habit breakdown ───────────────────────────────────────────────────────

  const habitBreakdown = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();

    let dates: string[];
    if (view === 'monthly') {
      const from  = isoDate(y, m, 1);
      const lastD = new Date(y, m + 1, 0).getDate();
      const to    = isoDate(y, m, lastD);
      dates = datesInRange(from, todayStr < to ? todayStr : to);
    } else {
      dates = weekDays.filter(d => !d.isFuture).map(d => d.dateStr);
    }

    return habits.map(habit => {
      let value = '';
      if (habit.kind === 'boolean') {
        const count = dates.filter(d => getHabitCurrentValue(habit, entries, d) >= habit.target).length;
        value = `${count} time${count !== 1 ? 's' : ''}`;
      } else {
        const sum = dates.reduce((acc, d) => {
          const e = entries.find(en => en.id === `${habit.id}_${d}`);
          return acc + (e?.value ?? 0);
        }, 0);
        value = `${sum}${habit.unit ? ' ' + habit.unit : ''}`;
      }
      return { id: habit.id, icon: habit.icon, name: habit.name, value };
    });
  }, [habits, entries, view, currentMonth, weekDays, todayStr]);

  // ── Month navigation ──────────────────────────────────────────────────────

  const monthIndex    = currentMonth.getFullYear() * 12 + currentMonth.getMonth();
  const todayMonthIdx = todayDate.getFullYear() * 12 + todayDate.getMonth();
  const canPrevMonth  = monthIndex > todayMonthIdx - 12;
  const canNextMonth  = monthIndex < todayMonthIdx;
  const weekEndStr    = toLocalDateString(weekEnd);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Calendar</Text>

        {/* Segmented control */}
        <View style={s.seg}>
          {(['weekly', 'monthly'] as const).map(v => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={[s.segBtn, view === v && s.segBtnActive]}
            >
              <Text style={[s.segBtnText, view === v && s.segBtnTextActive]}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Period navigation */}
        <View style={s.periodNav}>
          <Pressable
            onPress={() => {
              if (view === 'monthly') {
                if (!canPrevMonth) return;
                const m = new Date(currentMonth);
                m.setMonth(m.getMonth() - 1);
                setCurrentMonth(m);
              } else {
                const d = new Date(weekStart);
                d.setDate(d.getDate() - 7);
                setWeekStart(d);
              }
            }}
            style={s.navBtn}
            disabled={view === 'monthly' && !canPrevMonth}
          >
            <ChevronLeft
              size={20}
              strokeWidth={2.5}
              color={(view === 'monthly' && !canPrevMonth) ? '#C7C7CC' : '#008080'}
            />
          </Pressable>

          <Text style={s.periodLabel}>
            {view === 'monthly' ? monthLabel : weekLabel}
          </Text>

          <Pressable
            onPress={() => {
              if (view === 'monthly') {
                if (!canNextMonth) return;
                const m = new Date(currentMonth);
                m.setMonth(m.getMonth() + 1);
                setCurrentMonth(m);
              } else {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + 7);
                if (toLocalDateString(d) <= todayStr) setWeekStart(d);
              }
            }}
            style={s.navBtn}
            disabled={(view === 'monthly' && !canNextMonth) || (view === 'weekly' && weekEndStr >= todayStr)}
          >
            <ChevronRight
              size={20}
              strokeWidth={2.5}
              color={
                (view === 'monthly' && !canNextMonth) || (view === 'weekly' && weekEndStr >= todayStr)
                  ? '#C7C7CC'
                  : '#008080'
              }
            />
          </Pressable>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {view === 'monthly' ? (
          <>
            {/* ── Monthly calendar grid ──────────────────────────────── */}
            <View style={s.calCard}>
              <View style={s.dayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <Text key={d} style={s.dayHeader}>{d}</Text>
                ))}
              </View>
              <View style={s.calGrid}>
                {monthDays.map((dateStr, idx) => {
                  if (!dateStr) return <View key={`e-${idx}`} style={s.calCell} />;
                  const isToday  = dateStr === todayStr;
                  const isFuture = dateStr > todayStr;
                  const pct      = isFuture ? 0 : dailyCompletion(habits, entries, dateStr);
                  const color    = getProgressColor(pct);
                  const r = 14;
                  const circ = 2 * Math.PI * r;
                  const dayNum = parseInt(dateStr.split('-')[2], 10);
                  return (
                    <View key={dateStr} style={[s.calCell, isFuture && { opacity: 0.4 }]}>
                      <View style={{ width: 40, height: 40 }}>
                        {isToday ? (
                          <>
                            <Svg width={40} height={40} viewBox="0 0 40 40">
                              <Circle cx={20} cy={20} r={20} fill="#008080" />
                            </Svg>
                            <View style={StyleSheet.absoluteFillObject}>
                              <View style={s.cellCenter}>
                                <Text style={s.dayNumToday}>{dayNum}</Text>
                              </View>
                            </View>
                          </>
                        ) : (
                          <>
                            <Svg
                              width={40} height={40} viewBox="0 0 40 40"
                              style={{ transform: [{ rotate: '-90deg' }] }}
                            >
                              <Circle
                                cx={20} cy={20} r={r}
                                fill="none" stroke={color} strokeWidth={2}
                                strokeDasharray={circ}
                                strokeDashoffset={circ * (1 - pct / 100)}
                                strokeLinecap="round"
                              />
                            </Svg>
                            <View style={StyleSheet.absoluteFillObject}>
                              <View style={s.cellCenter}>
                                <Text style={s.dayNum}>{dayNum}</Text>
                              </View>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <CompletionRingCard
              title="Monthly completion"
              subtitle={`${monthStats.completed} of ${monthStats.total} days\ncompleted`}
              pct={monthStats.pct}
            />
            <StreakCard streak={currentStreak} daysCompleted={monthStats.completed} />
          </>
        ) : (
          <>
            {/* ── Weekly bar chart ───────────────────────────────────── */}
            <View style={s.barCard}>
              <View style={s.barChart}>
                {weekDays.map((day, i) => {
                  const color = day.isFuture ? '#E8E8ED' : getProgressColor(day.completion);
                  return (
                    <View key={i} style={s.barCol}>
                      <View style={s.barWrapper}>
                        {day.completion > 0 && !day.isFuture ? (
                          <>
                            <Text style={[s.barPct, { color }]}>{day.completion}%</Text>
                            <View style={[s.bar, { height: `${day.completion}%` as any, backgroundColor: color }]} />
                          </>
                        ) : (
                          <View style={[s.barFloor, { backgroundColor: color }]} />
                        )}
                      </View>
                      <Text style={[s.barLabel, day.isToday && s.barLabelToday]}>
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <CompletionRingCard
              title="Weekly completion"
              subtitle={`${weekStats.completed} of ${weekStats.total} days\ncompleted`}
              pct={weekStats.pct}
            />
            <StreakCard streak={currentStreak} daysCompleted={weekStats.completed} />
          </>
        )}

        {/* ── Habit breakdown ───────────────────────────────────────── */}
        <Text style={s.breakdownTitle}>
          {view === 'monthly' ? 'This Month' : 'This Week'}
        </Text>

        {habitBreakdown.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No habits yet. Add one on the Home tab.</Text>
          </View>
        ) : (
          <View style={s.breakdownCard}>
            {habitBreakdown.map((h, i) => (
              <View
                key={h.id}
                style={[s.breakdownRow, i < habitBreakdown.length - 1 && s.breakdownBorder]}
              >
                <View style={s.breakdownIconWrap}>
                  <Text style={s.breakdownIcon}>{h.icon}</Text>
                </View>
                <Text style={s.breakdownName}>{h.name}</Text>
                <Text style={s.breakdownValue}>{h.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared cards ─────────────────────────────────────────────────────────────

const STAT_R    = 50;
const STAT_CIRC = 2 * Math.PI * STAT_R;

function CompletionRingCard({
  title, subtitle, pct,
}: {
  title: string; subtitle: string; pct: number;
}) {
  const color  = getProgressColor(pct);
  const offset = STAT_CIRC * (1 - pct / 100);
  return (
    <View style={s.completionCard}>
      <View style={{ flex: 1 }}>
        <Text style={s.completionTitle}>{title}</Text>
        <Text style={s.completionSub}>{subtitle}</Text>
      </View>
      <View style={{ width: 130, height: 130 }}>
        <Svg width={130} height={130} viewBox="0 0 130 130"
          style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={65} cy={65} r={STAT_R} fill="none" stroke="#E5E5E7" strokeWidth={14} />
          <Circle cx={65} cy={65} r={STAT_R} fill="none" stroke={color} strokeWidth={14}
            strokeDasharray={STAT_CIRC} strokeDashoffset={offset} strokeLinecap="round" />
        </Svg>
        <View style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={s.completionPct}>{pct}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function StreakCard({ streak, daysCompleted }: { streak: number; daysCompleted: number }) {
  return (
    <View style={s.streakCard}>
      <View style={s.streakItem}>
        <View style={s.streakIconWrapOrange}>
          <Flame size={24} color="#FF9F0A" strokeWidth={2} />
        </View>
        <Text style={s.streakNum}>{streak}</Text>
        <Text style={s.streakLabel}>Current streak</Text>
      </View>
      <View style={s.streakItem}>
        <View style={s.streakIconWrapGreen}>
          <CalendarCheck size={24} color="#34C759" strokeWidth={2} />
        </View>
        <Text style={s.streakNum}>{daysCompleted}</Text>
        <Text style={s.streakLabel}>Days completed</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  headerTitle: {
    fontSize: 34, fontWeight: '700', color: '#1A1A1A',
    letterSpacing: -0.68, marginBottom: 12,
  },

  // Segmented control
  seg: {
    flexDirection: 'row', backgroundColor: '#E5E5E5',
    borderRadius: 10, padding: 2, marginBottom: 12,
  },
  segBtn:        { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segBtnActive:  {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 3, elevation: 1,
  },
  segBtnText:    { fontSize: 15, fontWeight: '500', color: '#666' },
  segBtnTextActive: { color: '#008080' },

  // Period navigation
  periodNav:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn:      { padding: 8 },
  periodLabel: { fontSize: 17, fontWeight: '600', color: '#1A1A1A' },

  // Monthly calendar
  calCard:    {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 16, marginBottom: 12,
  },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeader:  {
    flex: 1, textAlign: 'center',
    fontSize: 12, fontWeight: '600', color: '#999', paddingVertical: 8,
  },
  calGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:    {
    width: `${100 / 7}%` as any,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4,
  },
  cellCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum:      { fontSize: 15, color: '#1A1A1A' },
  dayNumToday: { fontSize: 15, fontWeight: '600', color: '#fff' },

  // Completion ring card
  completionCard: {
    backgroundColor: '#fff',
    borderRadius: 24, paddingVertical: 24, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, shadowRadius: 40, elevation: 6,
  },
  completionTitle: {
    fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 6, letterSpacing: -0.4,
  },
  completionSub: { fontSize: 17, color: '#8E8E93', lineHeight: 22 },
  completionPct: {
    fontSize: 30, fontWeight: '700', color: '#000', letterSpacing: -0.9,
  },

  // Streak card
  streakCard: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  streakItem:          { alignItems: 'center' },
  streakIconWrapOrange: {
    width: 48, height: 48, borderRadius: 24, marginBottom: 12,
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  streakIconWrapGreen: {
    width: 48, height: 48, borderRadius: 24, marginBottom: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  streakNum:   { fontSize: 48, fontWeight: '700', color: '#1A1A1A', lineHeight: 52, marginBottom: 8 },
  streakLabel: { fontSize: 15, color: '#8E8E93' },

  // Breakdown
  breakdownTitle: {
    fontSize: 22, fontWeight: '600', color: '#1A1A1A',
    marginTop: 16, marginBottom: 12, paddingLeft: 4,
  },
  breakdownCard:  {
    backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden', marginBottom: 12,
  },
  breakdownRow:   {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  breakdownBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F2F2F7' },
  breakdownIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F7F7F8',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  breakdownIcon:  { fontSize: 20 },
  breakdownName:  { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  breakdownValue: { fontSize: 15, color: '#666' },

  // Weekly bar chart
  barCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 12,
  },
  barChart:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 200 },
  barCol:    { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  barWrapper:{ flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  barPct:    { fontSize: 13, textAlign: 'center', marginBottom: 4 },
  bar:       { width: '100%', borderRadius: 8 },
  barFloor:  { width: '100%', height: 4, borderRadius: 4 },
  barLabel:  { fontSize: 12, color: '#999' },
  barLabelToday: { color: '#34C759', fontWeight: '600' },

  // Empty state
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center',
  },
  emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center' },
});
