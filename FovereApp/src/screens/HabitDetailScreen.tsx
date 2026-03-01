import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Palette } from '@/lib/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useHabitStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/context/ThemeContext';
import { today, isFuture } from '@/lib/dates';
import { getHabitCurrentValue, isHabitCompleted } from '@/lib/aggregates';
import { getProgressColor, PROGRESS_COLORS } from '@/lib/progressColors';
import { ScoreRing } from '@/components/ScoreRing';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>;

export default function HabitDetailScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { id, date: paramDate } = route.params;
  const todayStr = today();
  const viewDate = paramDate ?? todayStr;
  const isViewingFuture = isFuture(viewDate);

  const habit          = useHabitStore(s => s.habits.find(h => h.id === id));
  const allEntries     = useHabitStore(s => s.entries);
  const weekStartsOn   = useSettingsStore(s => s.weekStartsOn);
  const haptic         = Boolean(useSettingsStore(s => s.hapticFeedback));
  const incrementEntry = useHabitStore(s => s.incrementEntry);
  const decrementEntry = useHabitStore(s => s.decrementEntry);
  const logEntry       = useHabitStore(s => s.logEntry);
  const deleteEntry    = useHabitStore(s => s.deleteEntry);
  const pauseHabit     = useHabitStore(s => s.pauseHabit);
  const archiveHabit   = useHabitStore(s => s.archiveHabit);

  const currentValue = useMemo(
    () => habit ? getHabitCurrentValue(habit, allEntries, viewDate, weekStartsOn) : 0,
    [habit, allEntries, viewDate, weekStartsOn],
  );

  const completed = useMemo(
    () => habit ? isHabitCompleted(habit, allEntries, viewDate, weekStartsOn) : false,
    [habit, allEntries, viewDate, weekStartsOn],
  );

  const isBreak           = habit?.goalType === 'break';
  const overLimit         = isBreak && currentValue > (habit?.target ?? 0);
  const progressPct       = habit ? Math.min((currentValue / habit.target) * 100, 100) : 0;
  // Break: red at/over limit. Build: apple green when completed, else progress color.
  const ringStrokeColor   = isBreak && (progressPct >= 100 || overLimit)
    ? PROGRESS_COLORS.LOW
    : !isBreak && completed
      ? PROGRESS_COLORS.HIGH
      : getProgressColor(progressPct);
  const accentColor = isBreak ? PROGRESS_COLORS.LOW : (completed ? PROGRESS_COLORS.HIGH : '#008080');

  // Wire the navigation header title and Edit button
  useLayoutEffect(() => {
    if (!habit) return;
    navigation.setOptions({
      headerTitle: habit.name,
      headerTintColor: accentColor,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('EditHabit', { id: habit.id, screen: 'HabitType' })}
          hitSlop={8}
        >
          <Text style={[s.headerEdit, { color: accentColor }]}>Edit</Text>
        </Pressable>
      ),
    });
  }, [habit, navigation, accentColor]);

  const handleToggle = useCallback(() => {
    if (!habit || isViewingFuture) return;
    if (completed) {
      if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      deleteEntry(habit.id, viewDate);
    } else {
      if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      logEntry(habit.id, viewDate, 1);
    }
  }, [habit, completed, deleteEntry, logEntry, viewDate, isViewingFuture, haptic]);

  const handleIncrement = useCallback(() => {
    if (!habit || isViewingFuture) return;
    if (!isBreak && currentValue >= habit.target) return;
    const willReachGoal = currentValue + 1 >= habit.target;
    if (haptic && willReachGoal) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    incrementEntry(habit.id, viewDate);
  }, [habit, isBreak, currentValue, incrementEntry, viewDate, isViewingFuture, haptic]);

  const handleDecrement = useCallback(() => {
    if (!habit || currentValue <= 0 || isViewingFuture) return;
    decrementEntry(habit.id, viewDate);
  }, [habit, currentValue, decrementEntry, viewDate, isViewingFuture]);

  const handlePause = () => {
    if (!habit) return;
    Alert.alert(
      'Pause habit',
      `"${habit.name}" will be hidden from your daily list. You can resume it anytime from the Paused section on the home screen.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pause', onPress: () => { pauseHabit(id); navigation.goBack(); } },
      ],
    );
  };

  const handleDelete = () => {
    if (!habit) return;
    Alert.alert(
      'Delete Habit',
      `"${habit.name}" will be removed from your Home screen from today onward, but its past history will stay in Calendar and Analytics.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { archiveHabit(id); navigation.goBack(); },
        },
      ],
    );
  };

  if (!habit) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
        <View style={s.notFound}>
          <Text style={[s.notFoundText, { color: colors.text2 }]}>Habit not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const freqLabel    = habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1);
  const noun         = isBreak ? 'Limit' : 'Goal';
  const isViewingToday = viewDate === todayStr;
  const goalLabel    = habit.frequency === 'daily'
    ? (isViewingToday ? `Today's ${noun}` : `That day's ${noun}`)
    : habit.frequency === 'weekly'
      ? (isViewingToday ? `This Week's ${noun}` : `That week's ${noun}`)
      : (isViewingToday ? `This Month's ${noun}` : `That month's ${noun}`);
  const measureLabel = habit.kind === 'boolean' ? 'Yes / No' :
                       habit.unit ? `Count (${habit.unit})` : 'Count';

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Progress ring ─────────────────────────────────────────────── */}
        <View style={s.ringSection}>
          <ScoreRing
            value={progressPct}
            size={220}
            strokeWidth={12}
            radius={80}
            strokeColor={ringStrokeColor}
            renderCenter={() => (
              <View style={s.ringCenter}>
                {habit.kind === 'boolean' ? (
                  <Text style={[s.ringBoolMark, { color: completed || (isBreak && progressPct >= 100) ? accentColor : colors.chevron }]}>
                    {completed ? '✓' : '○'}
                  </Text>
                ) : (
                  <Text>
                    <Text style={[s.ringCurrent, { color: colors.text1 }]}>{currentValue}</Text>
                    <Text style={[s.ringTarget, { color: colors.text4 }]}>/{habit.target}</Text>
                  </Text>
                )}
                {habit.kind === 'numeric' && habit.unit ? (
                  <Text style={[s.ringUnit, { color: colors.text4 }]}>{habit.unit}</Text>
                ) : null}
              </View>
            )}
          />
          <Text style={[s.goalLabel, { color: colors.text3 }]}>{goalLabel}</Text>
          {overLimit && (
            <Text style={[s.overLimitBadge, { color: colors.danger }]}>Over limit — {currentValue - habit.target} too many</Text>
          )}
        </View>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        {isViewingFuture && (
          <Text style={[s.futureDateNote, { color: colors.text2 }]}>You can't add progress for future dates.</Text>
        )}
        {habit.kind === 'boolean' ? (
          <View style={s.boolRow}>
            <Pressable
              onPress={isViewingFuture ? undefined : handleToggle}
              disabled={isViewingFuture}
              style={({ pressed }) => [
                s.boolBtn,
                { borderColor: accentColor },
                completed && [s.boolBtnDone, { backgroundColor: accentColor }],
                !isViewingFuture && pressed && { opacity: 0.75 },
                isViewingFuture && s.ctrlBtnDisabled,
              ]}
            >
              <Text style={[s.boolBtnText, { color: accentColor }, completed && { color: colors.white }]}>
                {completed ? 'Done ✓' : 'Mark Done'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.numRow}>
            <Pressable
              onPress={isViewingFuture ? undefined : handleDecrement}
              disabled={currentValue === 0 || isViewingFuture}
              style={[s.ctrlBtn, { backgroundColor: colors.bgCard }, (currentValue === 0 || isViewingFuture) && s.ctrlBtnDisabled]}
            >
              <Minus size={24} color={accentColor} strokeWidth={2.5} />
            </Pressable>

            <Text style={[s.numValue, { color: colors.text1 }]}>{currentValue}</Text>

            <Pressable
              onPress={isViewingFuture ? undefined : handleIncrement}
              disabled={(!isBreak && currentValue >= habit.target) || isViewingFuture}
              style={[
                s.ctrlBtnPrimary,
                { backgroundColor: accentColor, shadowColor: accentColor },
                ((!isBreak && currentValue >= habit.target) || isViewingFuture) && s.ctrlBtnDisabled,
              ]}
            >
              <Plus size={24} color={colors.white} strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        {/* ── Info rows ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={[s.infoCard, { backgroundColor: colors.bgCard }]}>
            <InfoRow label="Frequency"   value={freqLabel}    last={false} colors={colors} />
            <InfoRow label="Measurement" value={measureLabel} last={false} colors={colors} />
            <InfoRow
              label={isBreak ? 'Limit' : 'Target'}
              value={`${habit.target}${habit.unit ? ' ' + habit.unit : ''}`}
              last={true}
              colors={colors}
            />
          </View>
        </View>

        {/* ── Description (optional) ───────────────────────────────────────────── */}
        {habit.description ? (
          <View style={s.section}>
            <View style={[s.descriptionCard, { backgroundColor: colors.bgCard }]}>
              <Text style={[s.descriptionLabel, { color: colors.text2 }]}>Description</Text>
              <Text style={[s.descriptionText, { color: colors.text1 }]}>{habit.description}</Text>
            </View>
          </View>
        ) : null}

        {/* ── Pause / Delete (only when viewing today — not past or future) ───── */}
        {isViewingToday && (
          <>
            <View style={s.section}>
              <Pressable
                onPress={handlePause}
                style={({ pressed }) => [s.pauseCard, { backgroundColor: colors.bgCard }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[s.pauseText, { color: colors.teal }]}>Pause habit</Text>
              </Pressable>
            </View>
            <View style={s.section}>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [s.deleteCard, { backgroundColor: colors.bgCard }, pressed && { opacity: 0.7 }]}
              >
                <Text style={[s.deleteText, { color: colors.danger }]}>Delete Habit</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function InfoRow({ label, value, last, colors }: { label: string; value: string; last: boolean; colors: Palette }) {
  return (
    <View style={[s.infoRow, !last && [s.infoRowBorder, { borderBottomColor: colors.separator }]]}>
      <Text style={[s.infoLabel, { color: colors.text3 }]}>{label}</Text>
      <Text style={[s.infoValue, { color: colors.text1 }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F2F2F7' },
  scroll:    { paddingBottom: 20 },
  notFound:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 17, color: '#8E8E93' },
  headerEdit:   { color: '#008080', fontSize: 17 },

  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 22,
  },

  // Ring
  ringSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 4 },
  ringCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringBoolMark:{ fontSize: 64, fontWeight: '300' },
  ringCurrent: { fontSize: 48, fontWeight: '300', color: '#1A1A1A' },
  ringTarget:  { fontSize: 32, color: '#999' },
  ringUnit:    { fontSize: 15, color: '#999', marginTop: 4 },
  goalLabel:   { fontSize: 17, color: '#666', marginTop: 8, marginBottom: 8 },
  overLimitBadge: {
    fontSize: 14, fontWeight: '600', color: '#FF3B30',
    marginBottom: 16, textAlign: 'center',
  },
  futureDateNote: {
    fontSize: 15, color: '#8E8E93', textAlign: 'center', marginBottom: 16,
  },

  // Boolean toggle
  boolRow:     { alignItems: 'center', marginBottom: 32 },
  boolBtn:     {
    paddingHorizontal: 48, paddingVertical: 16, borderRadius: 50,
    borderWidth: 2, borderColor: '#008080', backgroundColor: 'transparent',
  },
  boolBtnDone: { backgroundColor: '#008080' },
  boolBtnText: { fontSize: 17, fontWeight: '600', color: '#008080' },
  boolBtnTextDone: { color: '#fff' },

  // Numeric controls
  numRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 24, marginBottom: 32,
  },
  ctrlBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  ctrlBtnPrimary: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#008080',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#008080', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  ctrlBtnDisabled: { opacity: 0.3 },
  numValue: {
    fontSize: 56, fontWeight: '300', color: '#1A1A1A',
    minWidth: 90, textAlign: 'center',
  },

  // Info rows
  section:     { paddingHorizontal: 16, marginBottom: 12 },
  infoCard:    { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  infoRow:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  infoLabel: { fontSize: 17, color: '#666' },
  infoValue: { fontSize: 17, color: '#1A1A1A', fontWeight: '500' },

  // Pause
  pauseCard: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  pauseText: { fontSize: 17, color: '#008080' },

  // Delete
  deleteCard: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  deleteText: { fontSize: 17, color: '#FF3B30' },
});
