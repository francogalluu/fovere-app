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

import { useHabitStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import {
  dailyCompletion,
  dailyCompletedCount,
  getHabitCurrentValue,
  isHabitCompleted,
} from '@/lib/aggregates';
import { today, isFuture, getWeekDates } from '@/lib/dates';
import type { RootStackParamList } from '@/navigation/types';
import type { Habit } from '@/types/habit';

import { WeekCalendar } from '@/components/WeekCalendar';
import { ProgressHero } from '@/components/ProgressHero';
import { HabitCard } from '@/components/HabitCard';

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
  // Boolean() guard: coerces any edge-case AsyncStorage rehydration value to a real boolean.
  const haptic = Boolean(useSettingsStore(s => s.hapticFeedback));

  // ── Store slices — each selector returns a single stable value ──────────────
  //
  // RULE: never call .filter(), .map(), .sort(), or build object literals
  // inside a useHabitStore selector. Those create new references on every call,
  // which triggers React 18's "getSnapshot should be cached" infinite-loop
  // warning. Select raw state fields here; derive everything in useMemo below.

  const rawHabits       = useHabitStore(s => s.habits);       // stable array ref
  const entries         = useHabitStore(s => s.entries);      // stable array ref
  const selectedDate    = useHabitStore(s => s.selectedDate); // primitive string
  const setSelectedDate = useHabitStore(s => s.setSelectedDate);

  // Actions — stable function refs, selecting individually avoids subscribing
  // to the entire state object (which changes on every store mutation).
  const logEntry       = useHabitStore(s => s.logEntry);
  const deleteEntry    = useHabitStore(s => s.deleteEntry);
  const incrementEntry = useHabitStore(s => s.incrementEntry);
  const decrementEntry = useHabitStore(s => s.decrementEntry);
  const addHabit       = useHabitStore(s => s.addHabit);

  // ── Derived data — all computed outside selectors via useMemo ───────────────

  /** Active habits sorted by sortOrder — derived from stable rawHabits ref */
  const habits = useMemo(
    () =>
      rawHabits
        .filter(h => h.archivedAt === null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [rawHabits],
  );

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  /** Completion % for each visible day — powers the calendar ring dots */
  const completionByDate = useMemo(() => {
    const result: Record<string, number> = {};
    weekDates.forEach(d => {
      result[d] = dailyCompletion(habits, entries, d);
    });
    return result;
  }, [habits, entries, weekDates]);

  /** Completed / total counts for the hero card */
  const { completed, total } = useMemo(
    () => dailyCompletedCount(habits, entries, selectedDate),
    [habits, entries, selectedDate],
  );

  /** Habits split into sections matching the legacy layout */
  const dailyHabits   = useMemo(() => habits.filter(h => h.frequency === 'daily'),   [habits]);
  const weeklyHabits  = useMemo(() => habits.filter(h => h.frequency === 'weekly'),  [habits]);
  const monthlyHabits = useMemo(() => habits.filter(h => h.frequency === 'monthly'), [habits]);

  const isReadOnly = isFuture(selectedDate);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const getCardData = useCallback(
    (habit: Habit) => ({
      currentValue: getHabitCurrentValue(habit, entries, selectedDate),
      isCompleted:  isHabitCompleted(habit, entries, selectedDate),
    }),
    [entries, selectedDate],
  );

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleToggle = useCallback((habit: Habit) => {
    if (isReadOnly) return;
    const { isCompleted: done } = getCardData(habit);
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (done) {
      deleteEntry(habit.id, selectedDate);
    } else {
      logEntry(habit.id, selectedDate, 1);
    }
  }, [isReadOnly, getCardData, haptic, deleteEntry, logEntry, selectedDate]);

  const handleIncrement = useCallback((habit: Habit) => {
    if (isReadOnly) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementEntry(habit.id, selectedDate);
  }, [isReadOnly, haptic, incrementEntry, selectedDate]);

  const handleDecrement = useCallback((habit: Habit) => {
    if (isReadOnly) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    decrementEntry(habit.id, selectedDate);
  }, [isReadOnly, haptic, decrementEntry, selectedDate]);

  const handleAddSampleHabits = () => {
    SAMPLE_HABITS.forEach(h => addHabit(h));
    if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleNavigateToDetail = (habitId: string) => {
    navigation.navigate('HabitDetail', { id: habitId });
  };

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderHabitCard = (habit: Habit) => {
    const { currentValue, isCompleted } = getCardData(habit);
    return (
      <HabitCard
        key={habit.id}
        habit={habit}
        currentValue={currentValue}
        isCompleted={isCompleted}
        readOnly={isReadOnly}
        onPress={() => handleNavigateToDetail(habit.id)}
        onToggle={() => handleToggle(habit)}
        onIncrement={() => handleIncrement(habit)}
        onDecrement={() => handleDecrement(habit)}
      />
    );
  };

  const renderSection = (title: string, items: Habit[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={{ opacity: isReadOnly ? 0.5 : 1 }}>
          {items.map(renderHabitCard)}
        </View>
      </View>
    );
  };

  // ── UI ────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Fovere</Text>
          <Pressable
            onPress={() => navigation.navigate('NewHabit', { screen: 'HabitType' })}
            style={styles.addButton}
            accessibilityLabel="Add new habit"
          >
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>+</Text>
          </Pressable>
        </View>

        {/* ── Week calendar strip ─────────────────────────────────────────── */}
        <WeekCalendar
          selectedDate={selectedDate}
          completionByDate={completionByDate}
          onDateSelect={handleDateSelect}
        />

        {/* ── Progress hero ───────────────────────────────────────────────── */}
        <View style={{ marginTop: 8 }}>
          <ProgressHero
            selectedDate={selectedDate}
            completed={completed}
            total={total}
          />
        </View>

        {/* ── Future date banner ──────────────────────────────────────────── */}
        {isReadOnly && (
          <View style={styles.futureBanner}>
            <Text style={styles.futureBannerText}>Upcoming — habits shown as read-only</Text>
          </View>
        )}

        {/* ── Habit sections ──────────────────────────────────────────────── */}
        <View style={{ marginTop: 20 }}>
          {renderSection("Today's Habits", dailyHabits)}
          {renderSection('Weekly Habits',  weeklyHabits)}
          {renderSection('Monthly Habits', monthlyHabits)}
        </View>

        {/* ── Empty state / sample habits button ─────────────────────────── */}
        {habits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyBody}>
              Tap + above to create your first habit,{'\n'}
              or load sample data to explore the app.
            </Text>
            <Pressable
              onPress={handleAddSampleHabits}
              style={styles.sampleButton}
            >
              <Text style={styles.sampleButtonText}>Load sample habits</Text>
            </Pressable>
          </View>
        )}

        {/* ── Dev shortcut: quick-add samples when list is not empty ──────── */}
        {habits.length > 0 && (
          <View style={styles.devRow}>
            <Pressable onPress={handleAddSampleHabits} style={styles.devButton}>
              <Text style={styles.devButtonText}>＋ Add sample habits (dev)</Text>
            </Pressable>
          </View>
        )}

        {/* ── Jump to today ────────────────────────────────────────────────── */}
        {selectedDate !== today() && (
          <Pressable
            onPress={() => setSelectedDate(today())}
            style={styles.todayPill}
          >
            <Text style={styles.todayPillText}>Jump to Today</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    marginLeft: 4,
  },

  // Future date banner
  futureBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(142,142,147,0.12)',
    borderRadius: 12,
    alignItems: 'center',
  },
  futureBannerText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
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
    color: '#1A1A1A',
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  sampleButton: {
    backgroundColor: '#008080',
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
    color: '#008080',
    fontWeight: '500',
  },

  // Jump to today pill
  todayPill: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
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
    color: '#008080',
    fontWeight: '600',
  },
});
