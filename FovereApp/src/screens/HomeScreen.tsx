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
import { useTranslation } from 'react-i18next';
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
import { useTheme } from '@/context/ThemeContext';
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
  weekStartsOn,
  colors,
}: {
  date: string;
  onJumpToToday: () => void;
  compact?: boolean;
  weekStartsOn: 0 | 1;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
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
    () => dailyOnlyCompletedCount(rawHabits, entries, date, weekStartsOn),
    [rawHabits, entries, date, weekStartsOn],
  );

  const weeklyBuildHabitsForProgress = useMemo(
    () => habits.filter(h => h.frequency === 'weekly' && h.goalType !== 'break'),
    [habits],
  );
  const { completed: weeklyBuildCompleted, total: weeklyBuildTotal } = useMemo(() => {
    const active = weeklyBuildHabitsForProgress.filter(h => h.createdAt <= date);
    return {
      completed: active.filter(h => isHabitCompleted(h, entries, date, weekStartsOn)).length,
      total: active.length,
    };
  }, [weeklyBuildHabitsForProgress, entries, date, weekStartsOn]);

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
      completed: active.filter(h => isHabitCompleted(h, entries, date, weekStartsOn)).length,
      total: active.length,
    };
  }, [monthlyBuildHabits, entries, date, weekStartsOn]);
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
    () => dailyOverLimitCount(rawHabits, entries, date, weekStartsOn),
    [rawHabits, entries, date, weekStartsOn],
  );

  const isReadOnly = isFuture(date);
  const isTodayDate = date === today();
  const dailySectionLabel = t('home.todaysHabits', { date: formatDateTitle(date) });

  const getCardData = useCallback(
    (habit: Habit) => ({
      currentValue: getHabitCurrentValue(habit, entries, date, weekStartsOn),
      isCompleted: isHabitCompleted(habit, entries, date, weekStartsOn),
    }),
    [entries, date, weekStartsOn],
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
      { title: t('daySummary.daily'), habits: dailyBuildHabitsOnDate.map(toSummaryHabit) },
      { title: t('daySummary.weekly'), habits: weeklyBuildHabitsOnDate.map(toSummaryHabit) },
      { title: t('daySummary.monthly'), habits: monthlyBuildHabitsOnDate.map(toSummaryHabit) },
      { title: t('daySummary.breakHabits'), habits: allBreakHabitsOnDate.map(toSummaryHabit) },
    ],
    [t, dailyBuildHabitsOnDate, weeklyBuildHabitsOnDate, monthlyBuildHabitsOnDate, allBreakHabitsOnDate, toSummaryHabit],
  );

  const handleComplete = useCallback(
    (habit: Habit) => {
      if (isReadOnly) return;
      const { isCompleted: done } = getCardData(habit);
      if (done) {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        deleteEntry(habit.id, date);
      } else {
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      style={[s.dayScroll, { backgroundColor: colors.bgHome }]}
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
            <Text style={[s.sectionTitleText, compact && s.sectionTitleCompact, { color: colors.text1 }]}>{dailySectionLabel}</Text>
            {!isTodayDate && (
              <View style={[s.sectionBadge, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[s.sectionBadgeText, { color: colors.text2 }]}>{isReadOnly ? t('home.upcoming') : t('home.past')}</Text>
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
            <Text style={[s.sectionTitleText, compact && s.sectionTitleCompact, { color: colors.text1 }]}>{t('home.breakHabits')}</Text>
            {!isTodayDate && (
              <View style={[s.sectionBadge, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[s.sectionBadgeText, { color: colors.text2 }]}>{isReadOnly ? t('home.upcoming') : t('home.past')}</Text>
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
            <Text style={[s.sectionTitleText, compact && s.sectionTitleCompact, { color: colors.text1 }]}>{t('home.weeklyHabits')}</Text>
            {weeklyBuildTotal > 0 && (
              <Text style={[s.sectionMeta, { color: colors.text2 }]}>
                {t('home.percentThisWeek', { pct: String(Math.round((weeklyBuildCompleted / weeklyBuildTotal) * 100)) })}
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
            <Text style={[s.sectionTitleText, compact && s.sectionTitleCompact, { color: colors.text1 }]}>{t('home.monthlyHabits')}</Text>
            {monthlyBuildTotal > 0 && (
              <Text style={[s.sectionMeta, { color: colors.text2 }]}>
                {t('home.percentThisMonth', { pct: String(Math.round((monthlyBuildCompleted / monthlyBuildTotal) * 100)) })}
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
          <Text style={[s.emptyTitle, { color: colors.text1 }]}>{t('home.noHabitsYetShort')}</Text>
          <Text style={[s.emptyBody, { color: colors.text2 }]}>
            {t('home.addOneBelow')}
          </Text>
        </View>
      )}

      {!isTodayDate && (
        <Pressable
          onPress={onJumpToToday}
          style={({ pressed }) => [
            s.todayPill,
            { backgroundColor: colors.bgHome, borderColor: colors.tealSoft },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[s.todayPillText, { color: colors.teal }]}>{t('home.jumpToToday')}</Text>
        </Pressable>
      )}

      {isTodayDate && pausedHabits.length > 0 && (
        <View style={[s.section, compact && s.sectionCompact]}>
          <View style={s.sectionTitleRow}>
            <Text style={[s.sectionTitleText, compact && s.sectionTitleCompact, { color: colors.text1 }]}>{t('home.paused')}</Text>
          </View>
          <View style={s.pausedList}>
            {pausedHabits.map(h => (
              <View key={h.id} style={[s.pausedRow, { backgroundColor: colors.bgCard }]}>
                <Text style={s.pausedIcon}>{h.icon}</Text>
                <Text style={[s.pausedName, { color: colors.text1 }]} numberOfLines={1}>{h.name}</Text>
                <Pressable
                  onPress={() => {
                    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    unpauseHabit(h.id);
                  }}
                  style={({ pressed }) => [s.resumeBtn, { backgroundColor: colors.teal }, pressed && { opacity: 0.8 }]}
                >
                  <Play size={16} color={colors.white} strokeWidth={2.5} />
                  <Text style={[s.resumeBtnText, { color: colors.white }]}>{t('common.resume')}</Text>
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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const haptic = Boolean(useSettingsStore(s => s.hapticFeedback));
  const compactHomeView = useSettingsStore(s => s.compactHomeView);
  const setCompactHomeView = useSettingsStore(s => s.setCompactHomeView);
  const weekStartsOn = useSettingsStore(s => s.weekStartsOn);
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

  const scrollableWeeks = useMemo(() => getWeeksRange(12, 12, weekStartsOn), [weekStartsOn]);

  const completionByDate = useMemo(() => {
    const result: Record<string, number> = {};
    scrollableWeeks.flat().forEach(d => {
      result[d] = getDaySummary(rawHabits, entries, d, weekStartsOn).dailyOnlyCompletionPct;
    });
    return result;
  }, [rawHabits, entries, scrollableWeeks, weekStartsOn]);

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
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgHome }]}>
      <View style={[s.header, { backgroundColor: colors.bgHome }]}>
        <Text style={[s.titleApp, { color: colors.text1 }]}>{t('home.title')}</Text>
        <View style={s.headerActions}>
          <Pressable
            onPress={handleToggleCompact}
            style={[s.headerBtn, compactHomeView && [s.headerBtnActive, { backgroundColor: colors.teal, borderColor: colors.teal }], !compactHomeView && { borderColor: colors.teal }]}
            accessibilityLabel={compactHomeView ? 'Switch to full view' : 'Switch to compact view'}
          >
            <LayoutGrid size={22} color={compactHomeView ? colors.white : colors.teal} strokeWidth={2.5} />
          </Pressable>
          <Pressable
            onPress={openAddSheet}
            style={[s.addBtn, { backgroundColor: colors.teal }]}
            accessibilityLabel="Add new habit"
          >
            <Plus size={22} color={colors.white} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <View style={[s.calendarWrap, { backgroundColor: colors.bgHome }]}>
        <WeekCalendar
          weeks={scrollableWeeks}
          selectedDate={selectedDate}
          completionByDate={completionByDate}
          onDateSelect={handleDateSelect}
          weekStartsOn={weekStartsOn}
        />
      </View>

      <FlatList
        ref={listRef}
        data={dates}
        keyExtractor={(d) => d}
        style={[s.dayList, { backgroundColor: colors.bgHome }]}
        contentContainerStyle={{ backgroundColor: colors.bgHome }}
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
            <HomeDayContent
              date={date}
              onJumpToToday={handleJumpToToday}
              compact={compactHomeView}
              weekStartsOn={weekStartsOn}
              colors={colors}
            />
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
          <Animated.View style={[s.addSheetCard, { backgroundColor: colors.bgCard, borderColor: colors.separator, transform: [{ translateY: addSheetSlide }] }]}>
            <Text style={[s.addSheetTitle, { color: colors.text2 }]}>{t('home.newHabit')}</Text>
            <Pressable
              onPress={handleBuildHabit}
              style={({ pressed }) => [s.addSheetOption, pressed && { backgroundColor: colors.bgSecondary }]}
            >
              <View style={[s.addSheetIconWrapBuild, { backgroundColor: colors.successSoft }]}>
                <Sprout size={22} color={colors.success} strokeWidth={2.5} />
              </View>
              <Text style={[s.addSheetOptionText, { color: colors.text1 }]}>{t('home.buildGoodHabit')}</Text>
            </Pressable>
            <Pressable
              onPress={handleBreakHabit}
              style={({ pressed }) => [s.addSheetOption, pressed && { backgroundColor: colors.bgSecondary }]}
            >
              <View style={[s.addSheetIconWrapBreak, { backgroundColor: colors.dangerSoft }]}>
                <CircleSlash size={22} color={colors.danger} strokeWidth={2.5} />
              </View>
              <Text style={[s.addSheetOptionText, { color: colors.text1 }]}>{t('home.breakBadHabit')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Layout & design tokens (8pt grid, shadows) ─────────────────────────────────

const space = { space8: 8, space12: 12, space16: 16, space24: 24, space32: 32, space40: 40, space48: 48 } as const;
const LAYOUT_PADDING_H = 24;
const shadowCard = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  dayList: {
    flex: 1,
  },
  dayPage: {
    flex: 1,
  },
  dayScroll: {
    flex: 1,
  },
  scrollContent: {
    // Extra padding so card shadows (shadowRadius ~12, offset 4) aren’t cropped
    paddingHorizontal: LAYOUT_PADDING_H,
    paddingTop: space.space16,
    paddingBottom: space.space48,
  },
  calendarWrap: {
    width: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.space16,
    paddingBottom: space.space8,
    paddingHorizontal: LAYOUT_PADDING_H,
  },
  titleApp: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.space8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  headerBtnActive: {},
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroWrap: { marginTop: space.space16 },
  heroWrapCompact: { marginTop: space.space8 },
  section: {
    marginTop: space.space24,
  },
  sectionCompact: {
    marginTop: space.space16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
    marginBottom: space.space12,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
  },
  sectionTitleCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  sectionMeta: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  sectionBadge: {
    paddingHorizontal: space.space8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: space.space32,
    paddingTop: space.space40,
    paddingBottom: space.space24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
    marginBottom: space.space8,
  },
  emptyBody: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },
  todayPill: {
    alignSelf: 'center',
    marginTop: space.space16,
    minHeight: 44,
    paddingVertical: space.space12,
    paddingHorizontal: space.space24,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    ...shadowCard,
  },
  todayPillText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },

  pausedList: {
    gap: space.space8,
  },
  pausedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: space.space12,
    paddingHorizontal: space.space16,
    gap: space.space12,
    ...shadowCard,
  },
  pausedIcon: {
    fontSize: 24,
  },
  pausedName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.space8,
    paddingHorizontal: space.space16,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  resumeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },

  addSheetBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  addSheetCard: {
    borderRadius: 20,
    marginHorizontal: space.space16,
    marginBottom: space.space32,
    paddingTop: space.space16,
    paddingBottom: space.space24,
    paddingHorizontal: space.space24,
    borderWidth: 1,
    ...shadowCard,
  },
  addSheetTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: space.space8,
  },
  addSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.space16,
    paddingHorizontal: 4,
    gap: space.space16,
    minHeight: 44,
    justifyContent: 'flex-start',
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
    lineHeight: 22,
  },
});
