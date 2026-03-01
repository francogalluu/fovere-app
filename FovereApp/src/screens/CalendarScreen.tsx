import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Flame, CalendarCheck } from 'lucide-react-native';
import { useHabitStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/context/ThemeContext';
import { today, datesInRange, addDays, toLocalDateString, getWeekDates, getShortDayLabels } from '@/lib/dates';
import { getDaySummary } from '@/lib/daySummary';
import { getHabitCurrentValue, dailyCompletedCount, isHabitActiveOnDate } from '@/lib/aggregates';
import { getProgressColor } from '@/lib/progressColors';
import { BarChartWithTooltip, type ChartBar, type TooltipOverlayLayout } from '@/components/charts/BarChartWithTooltip';
import { ScoreRing } from '@/components/ScoreRing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatMonthDay(dateKey: string): string {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const { colors } = useTheme();
  const rawHabits = useHabitStore(s => s.habits);
  const entries   = useHabitStore(s => s.entries);
  const weekStartsOn = useSettingsStore(s => s.weekStartsOn);

  const todayStr = today();

  const habits = useMemo(() => {
    const seen = new Set<string>();
    return rawHabits.filter(h => {
      if (!isHabitActiveOnDate(h, todayStr) || seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });
  }, [rawHabits, todayStr]);

  const todayDate = new Date(todayStr + 'T00:00:00');

  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [tooltipOverlay, setTooltipOverlay] = useState<TooltipOverlayLayout>({ visible: false });
  const handleTooltipLayout = useCallback((layout: TooltipOverlayLayout) => setTooltipOverlay(layout), []);

  useEffect(() => {
    if (view === 'monthly') setTooltipOverlay({ visible: false });
  }, [view]);

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1),
  );

  const [weekStart, setWeekStart] = useState(() => {
    const ws = useSettingsStore.getState().weekStartsOn;
    const startStr = getWeekDates(todayStr, ws)[0];
    return new Date(startStr + 'T00:00:00');
  });

  useEffect(() => {
    const startStr = getWeekDates(todayStr, weekStartsOn)[0];
    setWeekStart(new Date(startStr + 'T00:00:00'));
  }, [weekStartsOn]);

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
    const scores    = dates.map(d => getDaySummary(rawHabits, entries, d, weekStartsOn).completionPct);
    const completed = scores.filter(v => v === 100).length;
    const pct       = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { pct, completed, total: dates.length };
  }, [currentMonth, rawHabits, entries, todayStr, weekStartsOn]);

  // ── Weekly bar data ───────────────────────────────────────────────────────

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const weekStartStr = toLocalDateString(weekStart);

  const weekChartBars = useMemo((): ChartBar[] => {
    const labels = getShortDayLabels(weekStartsOn);
    const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStartStr, i));
    return dates.map((dateStr, i) => {
      const pct = dateStr <= todayStr ? getDaySummary(rawHabits, entries, dateStr, weekStartsOn).completionPct : 0;
      const { completed, total } = dailyCompletedCount(rawHabits, entries, dateStr, weekStartsOn);
      return {
        key: dateStr,
        label: labels[i],
        percent: pct,
        completed,
        target: total,
      };
    });
  }, [weekStartStr, rawHabits, entries, todayStr, weekStartsOn]);

  const weekDays = useMemo(() => {
    const labels = getShortDayLabels(weekStartsOn);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDateString(d);
      return {
        label:      labels[i],
        dateStr,
        completion: dateStr <= todayStr ? getDaySummary(rawHabits, entries, dateStr, weekStartsOn).completionPct : 0,
        isFuture:   dateStr > todayStr,
        isToday:    dateStr === todayStr,
      };
    });
  }, [weekStart, rawHabits, entries, todayStr, weekStartsOn]);

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
    if (rawHabits.length === 0) return 0;
    let streak = 0;
    let cursor = todayStr;
    if (getDaySummary(rawHabits, entries, cursor, weekStartsOn).completionPct < 100) cursor = addDays(cursor, -1);
    while (cursor >= '2020-01-01') {
      if (getDaySummary(rawHabits, entries, cursor, weekStartsOn).completionPct === 100) {
        streak++;
        cursor = addDays(cursor, -1);
      } else break;
    }
    return streak;
  }, [rawHabits, entries, todayStr, weekStartsOn]);

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
        const count = dates.filter(d => getHabitCurrentValue(habit, entries, d, weekStartsOn) >= habit.target).length;
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
  }, [habits, entries, view, currentMonth, weekDays, todayStr, weekStartsOn]);

  // ── Month navigation ──────────────────────────────────────────────────────

  const monthIndex    = currentMonth.getFullYear() * 12 + currentMonth.getMonth();
  const todayMonthIdx = todayDate.getFullYear() * 12 + todayDate.getMonth();
  const canPrevMonth  = monthIndex > todayMonthIdx - 12;
  const canNextMonth  = monthIndex < todayMonthIdx;
  const weekEndStr    = toLocalDateString(weekEnd);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['top']}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <Text style={[s.headerTitle, { color: colors.text1 }]}>Calendar</Text>

        {/* Segmented control */}
        <View style={[s.seg, { backgroundColor: colors.separatorLight }]}>
          {(['weekly', 'monthly'] as const).map(v => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              style={[s.segBtn, view === v && [s.segBtnActive, { backgroundColor: colors.bgCard }]]}
            >
              <Text style={[s.segBtnText, { color: colors.text3 }, view === v && { color: colors.teal }]}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Period navigation — inside ScrollView so tooltip can overlap it */}
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
              color={(view === 'monthly' && !canPrevMonth) ? colors.chevron : colors.teal}
            />
          </Pressable>

          <Text style={[s.periodLabel, { color: colors.text1 }]}>
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
                  ? colors.chevron
                  : colors.teal
              }
            />
          </Pressable>
        </View>

        {view === 'monthly' ? (
          <>
            {/* ── Monthly calendar grid ──────────────────────────────── */}
            <View style={[s.calCard, { backgroundColor: colors.bgCard }]}>
              <View style={s.dayHeaders}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <Text key={d} style={[s.dayHeader, { color: colors.text4 }]}>{d}</Text>
                ))}
              </View>
              <View style={s.calGrid}>
                {monthDays.map((dateStr, idx) => {
                  if (!dateStr) return <View key={`e-${idx}`} style={s.calCell} />;
                  const isToday  = dateStr === todayStr;
                  const isFuture = dateStr > todayStr;
                  const pct      = isFuture ? 0 : getDaySummary(rawHabits, entries, dateStr, weekStartsOn).completionPct;
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
                              <Circle cx={20} cy={20} r={20} fill={colors.teal} />
                            </Svg>
                            <View style={StyleSheet.absoluteFillObject}>
                              <View style={s.cellCenter}>
                                <Text style={[s.dayNumToday, { color: colors.white }]}>{dayNum}</Text>
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
                                <Text style={[s.dayNum, { color: colors.text1 }]}>{dayNum}</Text>
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
              animationSlot="calendar-monthly"
            />
            <StreakCard streak={currentStreak} daysCompleted={monthStats.completed} />
          </>
        ) : (
          <>
            {/* ── Weekly bar chart (shared with Analytics) ───────────────────── */}
            <View style={[s.barCard, { backgroundColor: colors.bgCard }]}>
              <BarChartWithTooltip
                bars={weekChartBars}
                chartAreaHeight={220}
                getTooltipDateLabel={(bar) => formatMonthDay(bar.key)}
                todayIndex={weekChartBars.findIndex(b => b.key === todayStr)}
                emptyMessage="No data for this week"
                onTooltipLayout={handleTooltipLayout}
              />
            </View>

            <CompletionRingCard
              title="Weekly completion"
              subtitle={`${weekStats.completed} of ${weekStats.total} days\ncompleted`}
              pct={weekStats.pct}
              animationSlot="calendar-weekly"
            />
            <StreakCard streak={currentStreak} daysCompleted={weekStats.completed} />
          </>
        )}

        {/* ── Habit breakdown ───────────────────────────────────────── */}
        <Text style={[s.breakdownTitle, { color: colors.text1 }]}>
          {view === 'monthly' ? 'This Month' : 'This Week'}
        </Text>

        {habitBreakdown.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[s.emptyText, { color: colors.text2 }]}>No habits yet. Add one on the Home tab.</Text>
          </View>
        ) : (
          <View style={[s.breakdownCard, { backgroundColor: colors.bgCard }]}>
            {habitBreakdown.map((h, i) => (
              <View
                key={h.id}
                style={[s.breakdownRow, i < habitBreakdown.length - 1 && [s.breakdownBorder, { borderBottomColor: colors.separator }]]}
              >
                <View style={[s.breakdownIconWrap, { backgroundColor: colors.ring }]}>
                  <Text style={s.breakdownIcon}>{h.icon}</Text>
                </View>
                <Text style={[s.breakdownName, { color: colors.text1 }]}>{h.name}</Text>
                <Text style={[s.breakdownValue, { color: colors.text3 }]}>{h.value}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Tooltip overlay: frontmost layer so 100% label is never cropped and tooltip sits above filters */}
      {view === 'weekly' && tooltipOverlay.visible && (
        <View style={s.tooltipOverlay} pointerEvents="box-none">
          <View
            style={[
              s.tooltipOverlayBubble,
              {
                backgroundColor: colors.tooltipBg,
                position: 'absolute',
                left: tooltipOverlay.x,
                top: tooltipOverlay.y,
                width: tooltipOverlay.width,
                minHeight: tooltipOverlay.height,
              },
            ]}
          >
            <Text style={s.tooltipOverlayDate}>{tooltipOverlay.dateLabel}</Text>
            <Text style={s.tooltipOverlayPct}>{tooltipOverlay.pct}%</Text>
            {tooltipOverlay.detail ? (
              <Text style={s.tooltipOverlayDetail}>{tooltipOverlay.detail}</Text>
            ) : null}
          </View>
          {/* Pointer/arrow below the tooltip, centered on the selected bar */}
          <View
            style={[
              s.tooltipOverlayPointer,
              {
                borderTopColor: colors.tooltipBg,
                position: 'absolute',
                left: tooltipOverlay.pointerScreenX - 8,
                top: tooltipOverlay.y + tooltipOverlay.height - 1,
              },
            ]}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Shared cards ─────────────────────────────────────────────────────────────

function CompletionRingCard({
  title, subtitle, pct, animationSlot = 'calendar',
}: {
  title: string; subtitle: string; pct: number; animationSlot?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[s.completionCard, { backgroundColor: colors.bgCard }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.completionTitle, { color: colors.text1 }]}>{title}</Text>
        <Text style={[s.completionSub, { color: colors.text2 }]}>{subtitle}</Text>
      </View>
      <View style={s.completionRingWrap}>
        <ScoreRing
          key={animationSlot}
          value={pct}
          size={130}
          strokeWidth={14}
          radius={50}
          animationSlot={animationSlot}
          labelStyle={[s.completionPct, { color: colors.text1 }]}
          labelStyleWhenFull={s.completionPctFull}
        />
      </View>
    </View>
  );
}

function StreakCard({ streak, daysCompleted }: { streak: number; daysCompleted: number }) {
  const { colors } = useTheme();
  return (
    <View style={[s.streakCard, { backgroundColor: colors.bgCard }]}>
      <View style={s.streakItem}>
        <View style={[s.streakIconWrapOrange, { backgroundColor: colors.warningSoft }]}>
          <Flame size={24} color={colors.warning} strokeWidth={2} />
        </View>
        <Text style={[s.streakNum, { color: colors.text1 }]}>{streak}</Text>
        <Text style={[s.streakLabel, { color: colors.text2 }]}>Current streak</Text>
      </View>
      <View style={s.streakItem}>
        <View style={[s.streakIconWrapGreen, { backgroundColor: colors.successSoft }]}>
          <CalendarCheck size={24} color={colors.success} strokeWidth={2} />
        </View>
        <Text style={[s.streakNum, { color: colors.text1 }]}>{daysCompleted}</Text>
        <Text style={[s.streakLabel, { color: colors.text2 }]}>Days completed</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:  { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  headerTitle: {
    fontSize: 34, fontWeight: '700',
    letterSpacing: -0.68, marginBottom: 12,
  },

  // Segmented control
  seg: {
    flexDirection: 'row',
    borderRadius: 10, padding: 2, marginBottom: 12,
  },
  segBtn:        { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segBtnActive:  {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 3, elevation: 1,
  },
  segBtnText:    { fontSize: 15, fontWeight: '500' },
  segBtnTextActive: {},

  // Period navigation
  periodNav:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 8 },
  navBtn:      { padding: 8 },
  periodLabel: { fontSize: 17, fontWeight: '600' },

  // Monthly calendar
  calCard:    {
    borderRadius: 20,
    padding: 16, marginBottom: 12,
  },
  dayHeaders: { flexDirection: 'row', marginBottom: 8 },
  dayHeader:  {
    flex: 1, textAlign: 'center',
    fontSize: 12, fontWeight: '600', paddingVertical: 8,
  },
  calGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:    {
    width: `${100 / 7}%` as any,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4,
  },
  cellCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum:      { fontSize: 15 },
  dayNumToday: { fontSize: 15, fontWeight: '600' },

  // Completion ring card
  completionCard: {
    borderRadius: 24, paddingVertical: 24, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08, shadowRadius: 40, elevation: 6,
  },
  completionTitle: {
    fontSize: 22, fontWeight: '700', marginBottom: 6, letterSpacing: -0.4,
  },
  completionSub: { fontSize: 17, lineHeight: 22 },
  completionRingWrap: {
    width: 130,
    height: 130,
    flexShrink: 0,
  },
  completionPct: {
    fontSize: 28, fontWeight: '700', letterSpacing: -0.8,
  },
  completionPctFull: {
    fontSize: 22, letterSpacing: -0.5,
  },

  // Streak card
  streakCard: {
    borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  streakItem:          { alignItems: 'center' },
  streakIconWrapOrange: {
    width: 48, height: 48, borderRadius: 24, marginBottom: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  streakIconWrapGreen: {
    width: 48, height: 48, borderRadius: 24, marginBottom: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  streakNum:   { fontSize: 48, fontWeight: '700', lineHeight: 52, marginBottom: 8 },
  streakLabel: { fontSize: 15 },

  // Breakdown
  breakdownTitle: {
    fontSize: 22, fontWeight: '600',
    marginTop: 16, marginBottom: 12, paddingLeft: 4,
  },
  breakdownCard:  {
    borderRadius: 16,
    overflow: 'hidden', marginBottom: 12,
  },
  breakdownRow:   {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  breakdownBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  breakdownIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  breakdownIcon:  { fontSize: 20 },
  breakdownName:  { flex: 1, fontSize: 15, fontWeight: '500' },
  breakdownValue: { fontSize: 15 },

  // Weekly bar chart (shared component; barCard wraps it)
  barCard: {
    borderRadius: 20, padding: 24, marginBottom: 12,
    overflow: 'visible',
    zIndex: 10,
  },

  // Tooltip overlay (weekly): frontmost layer, above filters
  tooltipOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  tooltipOverlayBubble: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipOverlayDate: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 2 },
  tooltipOverlayPct: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  tooltipOverlayDetail: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  tooltipOverlayPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // Empty state
  emptyCard: {
    borderRadius: 16, padding: 24, alignItems: 'center',
  },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
