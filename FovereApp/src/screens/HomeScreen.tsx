import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  FlatList,
  useWindowDimensions,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Plus, Play, Sprout, CircleSlash, LayoutGrid } from 'lucide-react-native';

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
import { DaySummaryModal, type DaySummaryHabit, type DaySummarySection } from '@/components/DaySummaryModal';

const DAYS_BACK = 90;
const DAYS_FORWARD = 30;

// ─── HomeDayContent: one "page" of hero + habits for a given date ─────────────

function HomeDayContent({
  date,
  onJumpToToday,
  compact = false,
}: {
  date: string;
  onJumpToToday: () => void;
  compact?: boolean;
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
  const monthlyBuildHabits = useMemo(
    () => habits.filter(h => h.frequency === 'monthly' && h.goalType !== 'break'),
    [habits],
  );
  const { completed: monthlyBuildCompleted, total: monthlyBuildTotal } = useMemo(() => {
    const active = monthlyBuildHabits.filter(h => h.createdAt <= date);
    return {
      completed: active.filter(h => isHabitCompleted(h, entries, date)).length,
      total: active.length,
    };
  }, [monthlyBuildHabits, entries, date]);
  const allBreakHabits = useMemo(
    () => [...dailyBreakHabits, ...weeklyBreakHabits],
    [dailyBreakHabits, weeklyBreakHabits],
  );

  // Only show habits that existed on the viewed date (avoid showing today's new habit on yesterday)
  const dailyBuildHabitsOnDate = useMemo(
    () => dailyBuildHabits.filter(h => h.createdAt <= date),
    [dailyBuildHabits, date],
  );
  const dailyBreakHabitsOnDate = useMemo(
    () => dailyBreakHabits.filter(h => h.createdAt <= date),
    [dailyBreakHabits, date],
  );
  const weeklyBuildHabitsOnDate = useMemo(
    () => weeklyBuildHabits.filter(h => h.createdAt <= date),
    [weeklyBuildHabits, date],
  );
  const weeklyBreakHabitsOnDate = useMemo(
    () => weeklyBreakHabits.filter(h => h.createdAt <= date),
    [weeklyBreakHabits, date],
  );
  const monthlyBuildHabitsOnDate = useMemo(
    () => monthlyBuildHabits.filter(h => h.createdAt <= date),
    [monthlyBuildHabits, date],
  );
  const allBreakHabitsOnDate = useMemo(
    () => [...dailyBreakHabitsOnDate, ...weeklyBreakHabitsOnDate],
    [dailyBreakHabitsOnDate, weeklyBreakHabitsOnDate],
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

  const [summaryVisible, setSummaryVisible] = useState(false);

  const toSummaryHabit = useCallback(
    (habit: Habit): DaySummaryHabit => {
      const { currentValue, isCompleted } = getCardData(habit);
      const isOverLimit = habit.goalType === 'break' && currentValue > habit.target;
      return { habit, currentValue, isCompleted, isOverLimit };
    },
    [getCardData],
  );

  const summarySections: DaySummarySection[] = useMemo(
    () => [
      { title: 'Daily', habits: dailyBuildHabitsOnDate.map(toSummaryHabit) },
      { title: 'Weekly', habits: weeklyBuildHabitsOnDate.map(toSummaryHabit) },
      { title: 'Monthly', habits: monthlyBuildHabitsOnDate.map(toSummaryHabit) },
      { title: 'Break Habits', habits: allBreakHabitsOnDate.map(toSummaryHabit) },
    ],
    [dailyBuildHabitsOnDate, weeklyBuildHabitsOnDate, monthlyBuildHabitsOnDate, allBreakHabitsOnDate, toSummaryHabit],
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
        compact={compact}
      />
    );
  };

  return (
    <>
    <ScrollView
      style={s.dayScroll}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[compact ? s.heroWrapCompact : s.heroWrap]}>
        <ProgressHero
          selectedDate={date}
          completed={completed}
          total={total}
          overLimit={overLimitCount}
          onPress={() => setSummaryVisible(true)}
          compact={compact}
        />
      </View>

      {dailyBuildHabitsOnDate.length > 0 && (
        <View style={[s.section, compact && s.sectionCompact]}>
          <View style={s.sectionTitleRow}>
            <Text style={[s.sectionTitle, compact && s.sectionTitleCompact]}>{dailySectionLabel}</Text>
            {!isTodayDate && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{isReadOnly ? 'Upcoming' : 'Past'}</Text>
              </View>
            )}
          </View>
          <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
            {dailyBuildHabitsOnDate.map(renderHabitCard)}
          </View>
        </View>
      )}

      {allBreakHabitsOnDate.length > 0 && (
        <View style={[s.section, compact && s.sectionCompact]}>
          <View style={s.sectionTitleRow}>
            <Text style={[s.sectionTitle, compact && s.sectionTitleCompact]}>Break Habits</Text>
            {!isTodayDate && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{isReadOnly ? 'Upcoming' : 'Past'}</Text>
              </View>
            )}
          </View>
          <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
            {allBreakHabitsOnDate.map(renderHabitCard)}
          </View>
        </View>
      )}

      {weeklyBuildHabitsOnDate.length > 0 && (
        <View style={[s.section, compact && s.sectionCompact]}>
          <View style={s.sectionTitleRow}>
            <Text style={[s.sectionTitle, compact && s.sectionTitleCompact]}>Weekly Habits</Text>
            {weeklyBuildTotal > 0 && (
              <Text style={s.weeklyPct}>
                {Math.round((weeklyBuildCompleted / weeklyBuildTotal) * 100)}% this week
              </Text>
            )}
          </View>
          <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
            {weeklyBuildHabitsOnDate.map(renderHabitCard)}
          </View>
        </View>
      )}

      {monthlyBuildHabitsOnDate.length > 0 && (
        <View style={[s.section, compact && s.sectionCompact]}>
          <View style={s.sectionTitleRow}>
            <Text style={[s.sectionTitle, compact && s.sectionTitleCompact]}>Monthly Habits</Text>
            {monthlyBuildTotal > 0 && (
              <Text style={s.weeklyPct}>
                {Math.round((monthlyBuildCompleted / monthlyBuildTotal) * 100)}% this month
              </Text>
            )}
          </View>
          <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
            {monthlyBuildHabitsOnDate.map(renderHabitCard)}
          </View>
        </View>
      )}

      {habits.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>No habits yet</Text>
          <Text style={s.emptyBody}>
            Tap + above to create your first habit.
          </Text>
        </View>
      )}

      {!isTodayDate && (
        <Pressable onPress={onJumpToToday} style={s.todayPill}>
          <Text style={s.todayPillText}>Jump to Today</Text>
        </Pressable>
      )}

      {isTodayDate && pausedHabits.length > 0 && (
        <View style={[s.section, compact && s.sectionCompact]}>
          <View style={s.sectionTitleRow}>
            <Text style={[s.sectionTitle, compact && s.sectionTitleCompact]}>Paused</Text>
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
    <DaySummaryModal
      visible={summaryVisible}
      onClose={() => setSummaryVisible(false)}
      date={date}
      completed={completed}
      total={total}
      overLimit={overLimitCount}
      sections={summarySections}
    />
    </>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const haptic = Boolean(useSettingsStore(s => s.hapticFeedback));
  const compactHomeView = useSettingsStore(s => s.compactHomeView);
  const setCompactHomeView = useSettingsStore(s => s.setCompactHomeView);
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
  const hasScrolledToSelectedRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  // True only when selectedDate was set by a calendar tap (not a swipe).
  // The scroll effect reads this so swipe-originated changes do NOT re-trigger scrollToIndex,
  // which would set programmaticScrollRef=true and make the next swipe miss its marker update.
  const calendarTapRef = useRef(false);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Once on mount: open on today.
  useEffect(() => {
    setSelectedDate(todayStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll list to selectedDate ONLY when the change came from a calendar tap.
  useEffect(() => {
    if (!hasScrolledToSelectedRef.current) {
      hasScrolledToSelectedRef.current = true;
      return;
    }
    if (!calendarTapRef.current) return;
    calendarTapRef.current = false;

    const idx = dates.indexOf(selectedDate);
    if (idx < 0 || !listRef.current) return;

    // Debounce: rapid taps cancel earlier scroll; only one scroll fires for the last-tapped day.
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      scrollDebounceRef.current = null;
      programmaticScrollRef.current = true;
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    }, 80);
    return () => {
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
        scrollDebounceRef.current = null;
      }
    };
  }, [selectedDate, dates]);

  const scrollableWeeks = useMemo(() => getWeeksRange(12, 12), []);

  const completionByDate = useMemo(() => {
    const result: Record<string, number> = {};
    scrollableWeeks.flat().forEach(d => {
      result[d] = getDaySummary(rawHabits, entries, d).dailyOnlyCompletionPct;
    });
    return result;
  }, [rawHabits, entries, scrollableWeeks]);

  const handleDateSelect = useCallback((date: string) => {
    calendarTapRef.current = true;
    setSelectedDate(date);
  }, []);

  const handleJumpToToday = useCallback(() => {
    calendarTapRef.current = true;
    setSelectedDate(today());
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (programmaticScrollRef.current) return;
      if (viewableItems.length === 0) return;
      const item = viewableItems[viewableItems.length - 1];
      const index = item.index;
      if (index == null || index < 0 || index >= dates.length) return;
      const newDate = dates[index];
      setSelectedDate(newDate);
    },
    [dates],
  );

  const onMomentumScrollEnd = useCallback(() => {
    if (programmaticScrollRef.current) programmaticScrollRef.current = false;
  }, []);

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

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const addSheetSlide = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (addSheetVisible) {
      addSheetSlide.setValue(300);
      Animated.timing(addSheetSlide, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }, [addSheetVisible, addSheetSlide]);

  const openAddSheet = useCallback(() => setAddSheetVisible(true), []);
  const closeAddSheet = useCallback(() => {
    Animated.timing(addSheetSlide, {
      toValue: 300,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }).start(() => setAddSheetVisible(false));
  }, [addSheetSlide]);
  const handleBuildHabit = useCallback(() => {
    closeAddSheet();
    navigation.navigate('NewHabit', { screen: 'HabitSource', params: { goalType: 'build' } });
  }, [closeAddSheet, navigation]);
  const handleBreakHabit = useCallback(() => {
    closeAddSheet();
    navigation.navigate('NewHabit', { screen: 'HabitSource', params: { goalType: 'break' } });
  }, [closeAddSheet, navigation]);

  const handleToggleCompact = useCallback(() => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompactHomeView(!compactHomeView);
  }, [haptic, compactHomeView]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.appTitle}>Fovere</Text>
        <View style={s.headerActions}>
          <Pressable
            onPress={handleToggleCompact}
            style={[s.compactToggle, compactHomeView && s.compactToggleActive]}
            accessibilityLabel={compactHomeView ? 'Switch to full view' : 'Switch to compact view'}
          >
            <LayoutGrid size={20} color={compactHomeView ? '#fff' : C.teal} strokeWidth={2.5} />
          </Pressable>
          <Pressable
            onPress={openAddSheet}
            style={s.addButton}
            accessibilityLabel="Add new habit"
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
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
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        initialScrollIndex={todayIndex}
        onScrollToIndexFailed={onScrollToIndexFailed}
        windowSize={5}
        initialNumToRender={1}
        renderItem={({ item: date }) => (
          <View style={[s.dayPage, { width: screenWidth }]}>
            <HomeDayContent date={date} onJumpToToday={handleJumpToToday} compact={compactHomeView} />
          </View>
        )}
      />

      <Modal
        visible={addSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeAddSheet}
      >
        <View style={s.addSheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAddSheet} />
          <Animated.View style={[s.addSheetCard, { transform: [{ translateY: addSheetSlide }] }]}>
            <Text style={s.addSheetTitle}>New habit</Text>
            <Pressable
              onPress={handleBuildHabit}
              style={({ pressed }) => [s.addSheetOption, pressed && s.addSheetOptionPressed]}
            >
              <View style={s.addSheetIconWrapBuild}>
                <Sprout size={22} color="#34C759" strokeWidth={2.5} />
              </View>
              <Text style={s.addSheetOptionText}>Build good habit</Text>
            </Pressable>
            <Pressable
              onPress={handleBreakHabit}
              style={({ pressed }) => [s.addSheetOption, pressed && s.addSheetOptionPressed]}
            >
              <View style={s.addSheetIconWrapBreak}>
                <CircleSlash size={22} color="#fff" strokeWidth={2.5} />
              </View>
              <Text style={s.addSheetOptionText}>Break bad habit</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.teal,
  },
  compactToggleActive: {
    backgroundColor: C.teal,
    borderColor: C.teal,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroWrap: { marginTop: 8 },
  heroWrapCompact: { marginTop: 4 },
  // Sections (no extra horizontal padding; scrollContent provides it for shadow room)
  section: {
    marginTop: 24,
  },
  sectionCompact: {
    marginTop: 12,
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
  sectionTitleCompact: {
    fontSize: 17,
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

  // Add-habit bottom sheet (Build / Break choice)
  addSheetBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  addSheetCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 34,
    paddingTop: 14,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  addSheetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text2,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  addSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 16,
  },
  addSheetOptionPressed: {
    opacity: 0.7,
  },
  addSheetIconWrapBuild: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSheetIconWrapBreak: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSheetOptionText: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text1,
  },
});
