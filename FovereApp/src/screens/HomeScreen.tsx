import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';

import { useHabitStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import { getDaySummary } from '@/lib/daySummary';
import {
  dailyOnlyCompletedCount,
  weeklyHabitProgress,
  dailyOverLimitCount,
  getHabitCurrentValue,
  isHabitCompleted,
} from '@/lib/aggregates';
import { today, isFuture, getWeekDates, formatDateTitle } from '@/lib/dates';
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

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const haptic = Boolean(useSettingsStore(s => s.hapticFeedback));

  // ── Store slices — each selector returns a single stable value ──────────────
  const rawHabits       = useHabitStore(s => s.habits);
  const entries         = useHabitStore(s => s.entries);
  const selectedDate    = useHabitStore(s => s.selectedDate);
  const setSelectedDate = useHabitStore(s => s.setSelectedDate);

  const logEntry    = useHabitStore(s => s.logEntry);
  const deleteEntry = useHabitStore(s => s.deleteEntry);
  const addHabit    = useHabitStore(s => s.addHabit);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const habits = useMemo(() => {
    const seen = new Set<string>();
    return rawHabits
      .filter(h => {
        if (h.archivedAt !== null || seen.has(h.id)) return false;
        seen.add(h.id);
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [rawHabits]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const completionByDate = useMemo(() => {
    const result: Record<string, number> = {};
    weekDates.forEach(d => {
      result[d] = getDaySummary(habits, entries, d).dailyOnlyCompletionPct;
    });
    return result;
  }, [habits, entries, weekDates]);

  const { completed, total } = useMemo(
    () => dailyOnlyCompletedCount(habits, entries, selectedDate),
    [habits, entries, selectedDate],
  );

  // Weekly build only (for Weekly Habits section header %)
  const weeklyBuildHabitsForProgress = useMemo(
    () => habits.filter(h => h.frequency === 'weekly' && h.goalType !== 'break'),
    [habits],
  );
  const { completed: weeklyBuildCompleted, total: weeklyBuildTotal } = useMemo(
    () => weeklyHabitProgress(weeklyBuildHabitsForProgress, entries, selectedDate),
    [weeklyBuildHabitsForProgress, entries, selectedDate],
  );

  const dailyBuildHabits  = useMemo(
    () => habits.filter(h => h.frequency === 'daily' && h.goalType !== 'break'),
    [habits],
  );
  const dailyBreakHabits  = useMemo(
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
  // All break habits (daily + weekly) for the Break Habits section
  const allBreakHabits = useMemo(
    () => [...dailyBreakHabits, ...weeklyBreakHabits],
    [dailyBreakHabits, weeklyBreakHabits],
  );

  const overLimitCount = useMemo(
    () => dailyOverLimitCount(habits, entries, selectedDate),
    [habits, entries, selectedDate],
  );

  const isReadOnly   = isFuture(selectedDate);
  const isToday      = selectedDate === today();

  // Section title for the daily section — matches reference exactly
  const dailySectionLabel = `${formatDateTitle(selectedDate)}'s Habits`;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getCardData = useCallback(
    (habit: Habit) => ({
      currentValue: getHabitCurrentValue(habit, entries, selectedDate),
      isCompleted:  isHabitCompleted(habit, entries, selectedDate),
    }),
    [entries, selectedDate],
  );

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleComplete = useCallback((habit: Habit) => {
    if (isReadOnly) return;
    const { isCompleted: done } = getCardData(habit);
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (done) {
      deleteEntry(habit.id, selectedDate);
    } else {
      logEntry(habit.id, selectedDate, habit.target);
    }
  }, [isReadOnly, getCardData, haptic, deleteEntry, logEntry, selectedDate]);

  const handleAddSampleHabits = () => {
    SAMPLE_HABITS.forEach(h => addHabit(h));
    if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDateSelect = (date: string) => setSelectedDate(date);

  const handleNavigateToDetail = (habitId: string) =>
    navigation.navigate('HabitDetail', { id: habitId });

  // ── Render helpers ───────────────────────────────────────────────────────────

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
      />
    );
  };

  // ── UI ───────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.appTitle}>Fovere</Text>
          <Pressable
            onPress={() => navigation.navigate('NewHabit', { screen: 'HabitType' })}
            style={s.addButton}
            accessibilityLabel="Add new habit"
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* ── Week calendar strip ──────────────────────────────────────────── */}
        <WeekCalendar
          selectedDate={selectedDate}
          completionByDate={completionByDate}
          onDateSelect={handleDateSelect}
        />

        {/* ── Progress hero ────────────────────────────────────────────────── */}
        <View style={{ marginTop: 8 }}>
          <ProgressHero
            selectedDate={selectedDate}
            completed={completed}
            total={total}
            overLimit={overLimitCount}
          />
        </View>

        {/* ── Daily build habits ───────────────────────────────────────────── */}
        {dailyBuildHabits.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionTitleRow}>
              <Text style={s.sectionTitle}>{dailySectionLabel}</Text>
              {!isToday && (
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

        {/* ── Break habits (daily + weekly) ────────────────────────────────── */}
        {allBreakHabits.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionTitleRow}>
              <Text style={s.sectionTitle}>Break Habits</Text>
              {!isToday && (
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

        {/* ── Weekly build habits only ──────────────────────────────────────── */}
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

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {habits.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No habits yet</Text>
            <Text style={s.emptyBody}>
              Tap + above to create your first habit,{'\n'}
              or load sample data to explore the app.
            </Text>
            <Pressable onPress={handleAddSampleHabits} style={s.sampleButton}>
              <Text style={s.sampleButtonText}>Load sample habits</Text>
            </Pressable>
          </View>
        )}

        {/* ── Dev shortcut ─────────────────────────────────────────────────── */}
        {habits.length > 0 && (
          <View style={s.devRow}>
            <Pressable onPress={handleAddSampleHabits} style={s.devButton}>
              <Text style={s.devButtonText}>＋ Add sample habits (dev)</Text>
            </Pressable>
          </View>
        )}

        {/* ── Jump to today pill ───────────────────────────────────────────── */}
        {!isToday && (
          <Pressable onPress={() => setSelectedDate(today())} style={s.todayPill}>
            <Text style={s.todayPillText}>Jump to Today</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgHome,
  },
  scroll: {
    flex: 1,
    backgroundColor: C.bgHome,
  },
  scrollContent: {
    // Extra padding so card shadows (shadowRadius ~12, offset 4) aren’t cropped
    paddingHorizontal: 28,
    paddingBottom: 52,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
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
});
