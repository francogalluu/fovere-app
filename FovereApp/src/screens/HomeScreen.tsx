import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Plus, Play } from 'lucide-react-native';

import { useHabitStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import { getDaySummary } from '@/lib/daySummary';
import {
  dailyOnlyCompletedCount,
  dailyOverLimitCount,
  getHabitCurrentValue,
  isHabitActiveOnDate,
  isHabitCompleted,
} from '@/lib/aggregates';
import { today, isFuture, getWeekDates, getWeeksRange, formatDateTitle, addDays } from '@/lib/dates';
import { C } from '@/lib/tokens';
import type { RootStackParamList } from '@/navigation/types';
import type { Habit } from '@/types/habit';

import { WeekCalendar } from '@/components/WeekCalendar';
import { ProgressHero } from '@/components/ProgressHero';
import { SwipeableHabitCard } from '@/components/SwipeableHabitCard';

// ─── Sample habits for testing before the wizard is built ─────────────────────
const SAMPLE_HABITS: Array<Omit<Habit, 'id' | 'createdAt' | 'archivedAt' | 'sortOrder'>> = [
  { name: 'Morning Run',  icon: '🏃', kind: 'numeric',  frequency: 'daily',  target: 30, unit: 'min' },
  { name: 'Drink Water',  icon: '💧', kind: 'numeric',  frequency: 'daily',  target: 8,  unit: 'glasses' },
  { name: 'Read',         icon: '📚', kind: 'boolean',  frequency: 'daily',  target: 1 },
  { name: 'Yoga Class',   icon: '🧘', kind: 'numeric',  frequency: 'weekly', target: 3,  unit: 'times' },
];

const DAYS_BACK = 90;
const DAYS_FORWARD = 30;

// ─── HomeDayContent: one "page" of hero + habits for a given date ─────────────

function HomeDayContent({
  date,
  onJumpToToday,
}: {
  date: string;
  onJumpToToday: () => void;
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const haptic = Boolean(useSettingsStore(s => s.hapticFeedback));
  const rawHabits = useHabitStore(s => s.habits);
  const entries = useHabitStore(s => s.entries);
  const logEntry = useHabitStore(s => s.logEntry);
  const deleteEntry = useHabitStore(s => s.deleteEntry);
  const pauseHabit = useHabitStore(s => s.pauseHabit);
  const unpauseHabit = useHabitStore(s => s.unpauseHabit);
  const archiveHabit = useHabitStore(s => s.archiveHabit);
  const addHabit = useHabitStore(s => s.addHabit);

  const habits = useMemo(() => {
    const seen = new Set<string>();
    return rawHabits
      .filter(h => {
        if (!isHabitActiveOnDate(h, date) || seen.has(h.id)) return false;
        seen.add(h.id);
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [rawHabits, date]);

  const pausedHabits = useMemo(
    () =>
      rawHabits
        .filter(h => h.pausedAt && !h.archivedAt)
        .sort((a, b) => (b.pausedAt! > a.pausedAt! ? 1 : -1)),
    [rawHabits],
  );

  const { completed, total } = useMemo(
    () => dailyOnlyCompletedCount(rawHabits, entries, date),
    [rawHabits, entries, date],
  );

  const weeklyBuildHabitsForProgress = useMemo(
    () => habits.filter(h => h.frequency === 'weekly' && h.goalType !== 'break'),
    [habits],
  );
  const { completed: weeklyBuildCompleted, total: weeklyBuildTotal } = useMemo(() => {
    const active = weeklyBuildHabitsForProgress.filter(h => h.createdAt <= date);
    return {
      completed: active.filter(h => isHabitCompleted(h, entries, date)).length,
      total: active.length,
    };
  }, [weeklyBuildHabitsForProgress, entries, date]);

  const dailyBuildHabits = useMemo(
    () => habits.filter(h => h.frequency === 'daily' && h.goalType !== 'break'),
    [habits],
  );
  const dailyBreakHabits = useMemo(
    () => habits.filter(h => h.frequency === 'daily' && h.goalType === 'break'),
    [habits],
  );
  const weeklyBreakHabits = useMemo(
    () => habits.filter(h => h.frequency === 'weekly' && h.goalType === 'break'),
    [habits],
  );
  const weeklyBuildHabits = useMemo(
    () => habits.filter(h => h.frequency === 'weekly' && h.goalType !== 'break'),
    [habits],
  );
  const allBreakHabits = useMemo(
    () => [...dailyBreakHabits, ...weeklyBreakHabits],
    [dailyBreakHabits, weeklyBreakHabits],
  );

  const overLimitCount = useMemo(
    () => dailyOverLimitCount(rawHabits, entries, date),
    [rawHabits, entries, date],
  );

  const isReadOnly = isFuture(date);
  const isTodayDate = date === today();
  const dailySectionLabel = `${formatDateTitle(date)}'s Habits`;

  const getCardData = useCallback(
    (habit: Habit) => ({
      currentValue: getHabitCurrentValue(habit, entries, date),
      isCompleted: isHabitCompleted(habit, entries, date),
    }),
    [entries, date],
  );

  const handleComplete = useCallback(
    (habit: Habit) => {
      if (isReadOnly) return;
      const { isCompleted: done } = getCardData(habit);
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (done) {
        deleteEntry(habit.id, date);
      } else {
        logEntry(habit.id, date, habit.target);
      }
    },
    [isReadOnly, getCardData, haptic, deleteEntry, logEntry, date],
  );

  const handleNavigateToDetail = (habitId: string) => {
    if (isReadOnly) return;
    navigation.navigate('HabitDetail', { id: habitId, date });
  };

  const renderHabitCard = (habit: Habit) => {
    const { currentValue, isCompleted } = getCardData(habit);
    return (
      <SwipeableHabitCard
        key={habit.id}
        habit={habit}
        currentValue={currentValue}
        isCompleted={isCompleted}
        readOnly={isReadOnly}
        onPress={() => handleNavigateToDetail(habit.id)}
        onComplete={() => handleComplete(habit)}
        onDelete={isTodayDate ? () => archiveHabit(habit.id) : undefined}
        onPause={isTodayDate ? () => pauseHabit(habit.id) : undefined}
      />
    );
  };

  return (
    <ScrollView
      style={s.dayScroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginTop: 8 }}>
        <ProgressHero
          selectedDate={date}
          completed={completed}
          total={total}
          overLimit={overLimitCount}
        />
      </View>

      {dailyBuildHabits.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Text style={s.sectionTitle}>{dailySectionLabel}</Text>
            {!isTodayDate && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{isReadOnly ? 'Upcoming' : 'Past'}</Text>
              </View>
            )}
          </View>
          <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
            {dailyBuildHabits.map(renderHabitCard)}
          </View>
        </View>
      )}

      {allBreakHabits.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Text style={s.sectionTitle}>Break Habits</Text>
            {!isTodayDate && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{isReadOnly ? 'Upcoming' : 'Past'}</Text>
              </View>
            )}
          </View>
          <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
            {allBreakHabits.map(renderHabitCard)}
          </View>
        </View>
      )}

      {weeklyBuildHabits.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Text style={s.sectionTitle}>Weekly Habits</Text>
            {weeklyBuildTotal > 0 && (
              <Text style={s.weeklyPct}>
                {Math.round((weeklyBuildCompleted / weeklyBuildTotal) * 100)}% this week
              </Text>
            )}
          </View>
          <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
            {weeklyBuildHabits.map(renderHabitCard)}
          </View>
        </View>
      )}

      {habits.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>No habits yet</Text>
          <Text style={s.emptyBody}>
            Tap + above to create your first habit,{'\n'}
            or load sample data to explore the app.
          </Text>
          <Pressable
            onPress={() => {
              SAMPLE_HABITS.forEach(h => addHabit(h));
              if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
            style={s.sampleButton}
          >
            <Text style={s.sampleButtonText}>Load sample habits</Text>
          </Pressable>
        </View>
      )}

      {!isTodayDate && (
        <Pressable onPress={onJumpToToday} style={s.todayPill}>
          <Text style={s.todayPillText}>Jump to Today</Text>
        </Pressable>
      )}

      {isTodayDate && pausedHabits.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Text style={s.sectionTitle}>Paused</Text>
          </View>
          <View style={s.pausedList}>
            {pausedHabits.map(h => (
              <View key={h.id} style={s.pausedRow}>
                <Text style={s.pausedIcon}>{h.icon}</Text>
                <Text style={s.pausedName} numberOfLines={1}>{h.name}</Text>
                <Pressable
                  onPress={() => {
                    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    unpauseHabit(h.id);
                  }}
                  style={({ pressed }) => [s.resumeBtn, pressed && { opacity: 0.8 }]}
                >
                  <Play size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={s.resumeBtnText}>Resume</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const haptic = Boolean(useSettingsStore(s => s.hapticFeedback));
  const { width: screenWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<string>>(null);

  const rawHabits = useHabitStore(s => s.habits);
  const entries = useHabitStore(s => s.entries);
  const selectedDate = useHabitStore(s => s.selectedDate);
  const setSelectedDate = useHabitStore(s => s.setSelectedDate);

  const logEntry = useHabitStore(s => s.logEntry);
  const deleteEntry = useHabitStore(s => s.deleteEntry);
  const pauseHabit = useHabitStore(s => s.pauseHabit);
  const unpauseHabit = useHabitStore(s => s.unpauseHabit);
  const archiveHabit = useHabitStore(s => s.archiveHabit);
  const addHabit = useHabitStore(s => s.addHabit);

  const todayStr = today();
  const dates = useMemo(
    () =>
      Array.from({ length: DAYS_BACK + 1 + DAYS_FORWARD }, (_, i) =>
        addDays(todayStr, i - DAYS_BACK),
      ),
    [todayStr],
  );
  const todayIndex = DAYS_BACK;
  const mountTimeRef = useRef<number>(Date.now());
  const hasScrolledToSelectedRef = useRef(false);
  const programmaticScrollRef = useRef(false);

  // Once on mount: open on today. (onMomentumScrollEnd is ignored for 500ms so this isn’t overwritten.)
  useEffect(() => {
    setSelectedDate(todayStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When selectedDate changes (e.g. from week calendar tap), scroll list to that day.
  // Skip on initial mount so we don't fight with initialScrollIndex (which shows today).
  useEffect(() => {
    if (!hasScrolledToSelectedRef.current) {
      hasScrolledToSelectedRef.current = true;
      return;
    }
    const idx = dates.indexOf(selectedDate);
    if (idx >= 0 && listRef.current) {
      programmaticScrollRef.current = true;
      listRef.current.scrollToIndex({ index: idx, animated: true });
    }
  }, [selectedDate, dates]);

  const scrollableWeeks = useMemo(() => getWeeksRange(12, 12), []);

  const completionByDate = useMemo(() => {
    const result: Record<string, number> = {};
    scrollableWeeks.flat().forEach(d => {
      result[d] = getDaySummary(rawHabits, entries, d).dailyOnlyCompletionPct;
    });
    return result;
  }, [rawHabits, entries, scrollableWeeks]);

  const handleDateSelect = (date: string) => setSelectedDate(date);

  const handleJumpToToday = useCallback(() => setSelectedDate(today()), []);

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      // Ignore the scroll end that follows our own scrollToIndex (calendar tap).
      // Otherwise we get a feedback loop: tap yesterday → scroll to 89 → onMomentumScrollEnd
      // rounds to 90 → setSelectedDate(today) → scroll to 90 → onMomentumScrollEnd rounds to 89 → bounce.
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      if (Date.now() - mountTimeRef.current < 500) return;
      if (screenWidth <= 0) return;
      const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      const clamped = Math.max(0, Math.min(index, dates.length - 1));
      const newDate = dates[clamped];
      if (newDate !== selectedDate) setSelectedDate(newDate);
    },
    [screenWidth, dates, selectedDate],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: screenWidth,
      offset: index * screenWidth,
      index,
    }),
    [screenWidth],
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number }) => {
      setTimeout(() => {
        programmaticScrollRef.current = true;
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
        });
      }, 100);
    },
    [],
  );

  const handleAddSampleHabits = useCallback(() => {
    SAMPLE_HABITS.forEach(h => addHabit(h));
    if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [addHabit, haptic]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.appTitle}>Fovere</Text>
        <Pressable
          onPress={() => navigation.navigate('NewHabit', { screen: 'HabitSource' })}
          style={s.addButton}
          accessibilityLabel="Add new habit"
        >
          <Plus size={20} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <WeekCalendar
        weeks={scrollableWeeks}
        selectedDate={selectedDate}
        completionByDate={completionByDate}
        onDateSelect={handleDateSelect}
      />

      <FlatList
        ref={listRef}
        data={dates}
        keyExtractor={(d) => d}
        style={s.dayList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        initialScrollIndex={todayIndex}
        onScrollToIndexFailed={onScrollToIndexFailed}
        windowSize={5}
        initialNumToRender={1}
        renderItem={({ item: date }) => (
          <View style={[s.dayPage, { width: screenWidth }]}>
            <HomeDayContent date={date} onJumpToToday={handleJumpToToday} />
          </View>
        )}
      />

      {rawHabits.length > 0 && (
        <View style={s.devRow}>
          <Pressable onPress={handleAddSampleHabits} style={s.devButton}>
            <Text style={s.devButtonText}>＋ Add sample habits (dev)</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgHome,
  },
  dayList: {
    flex: 1,
  },
  dayPage: {
    flex: 1,
  },
  dayScroll: {
    flex: 1,
    backgroundColor: C.bgHome,
  },
  scrollContent: {
    // Extra padding so card shadows (shadowRadius ~12, offset 4) aren’t cropped
    paddingHorizontal: 28,
    paddingBottom: 52,
  },

  // Header (horizontal padding matches scrollContent so title aligns with sections)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 28,
    backgroundColor: C.bgHome,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: C.text1,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections (no extra horizontal padding; scrollContent provides it for shadow room)
  section: {
    marginTop: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text1,
    marginLeft: 4,
  },

  // Weekly percentage label (right side of Weekly Habits title)
  weeklyPct: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '400',
    color: C.text2,
  },

  // Past/Upcoming badge
  badge: {
    backgroundColor: C.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text2,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text1,
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 16,
    color: C.text2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  sampleButton: {
    backgroundColor: C.teal,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  sampleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Dev shortcut
  devRow: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  devButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,128,128,0.3)',
  },
  devButtonText: {
    fontSize: 13,
    color: C.teal,
    fontWeight: '500',
  },

  // Jump to today pill
  todayPill: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: C.bgHome,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,128,128,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayPillText: {
    fontSize: 14,
    color: C.teal,
    fontWeight: '600',
  },

  // Paused habits
  pausedList: {
    gap: 10,
  },
  pausedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pausedIcon: {
    fontSize: 24,
  },
  pausedName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: C.text1,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.teal,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  resumeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
