/**
 * HabitTypeStep — the wizard's entry screen / summary form.
 *
 * Matches reference NewHabit.tsx exactly:
 *   • Cancel (left) | title | Save (right)  — configured via navigation header
 *   • Build / Break segmented control        — teal active, #3C3C43 inactive
 *   • Section 1: Habit Name, Icon            — chevron rows → sub-steps
 *   • Section 2: Frequency, Measure By       — chevron rows → sub-steps
 *   • Section 3: Reminder toggle, Time row   — inline toggle + conditional row
 */
import React, { useLayoutEffect, useEffect, useCallback } from 'react';
import {
  View, Text, Switch, Pressable,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';

import { useHabitStore } from '@/store';
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';

type Props = NativeStackScreenProps<WizardStackParamList, 'HabitType'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatReminderTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function measureByLabel(kind: 'boolean' | 'numeric', target: number, unit: string): string {
  if (kind === 'boolean') return 'Completion';
  const t = target > 0 ? target : 1;
  return unit.trim() ? `${t} ${unit.trim()}` : String(t);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HabitTypeStep({ navigation }: Props) {
  // ── Wizard store ───────────────────────────────────────────────────────────
  const {
    habitId, goalType, name, icon, kind, frequency,
    target, unit, reminderEnabled, reminderTime,
    reset, loadHabit,
    setGoalType, setReminderEnabled,
  } = useWizardStore();

  // ── Habit store actions ────────────────────────────────────────────────────
  const addHabit    = useHabitStore(s => s.addHabit);
  const updateHabit = useHabitStore(s => s.updateHabit);

  // ── Init: detect edit vs new ───────────────────────────────────────────────
  useEffect(() => {
    const parentState = navigation.getParent()?.getState();
    const editRoute   = parentState?.routes.find(r => r.name === 'EditHabit');
    const editId      = (editRoute?.params as { id?: string } | undefined)?.id;

    if (editId) {
      const habit = useHabitStore.getState().habits.find(h => h.id === editId);
      if (habit) {
        loadHabit(habit);
        return;
      }
    }
    // New habit: reset only if not already editing (avoid resetting mid-flow)
    if (!habitId) reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEdit = !!habitId;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    reset();
    navigation.getParent()?.goBack();
  }, [reset, navigation]);

  const handleSave = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    const resolvedTarget = kind === 'boolean' ? 1 : Math.max(1, target);
    const resolvedUnit   = kind === 'boolean' ? undefined : (unit.trim() || undefined);
    const resolvedReminder = reminderEnabled ? reminderTime : undefined;

    if (isEdit && habitId) {
      updateHabit(habitId, {
        goalType,
        name: trimmed,
        icon,
        kind,
        frequency,
        target: resolvedTarget,
        unit:   resolvedUnit,
        reminderTime: resolvedReminder,
      });
    } else {
      addHabit({
        goalType,
        name: trimmed,
        icon,
        kind,
        frequency,
        target: resolvedTarget,
        unit:   resolvedUnit,
        reminderTime: resolvedReminder,
      });
    }
    reset();
    navigation.getParent()?.goBack();
  }, [name, icon, kind, frequency, target, unit, reminderEnabled, reminderTime, isEdit, habitId, addHabit, updateHabit, reset, navigation]);

  // ── Header buttons ─────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Habit' : 'New Habit',
      headerLeft: () => (
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Text style={s.headerBtn}>Cancel</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={handleSave} hitSlop={8}>
          <Text style={[s.headerBtn, s.headerBtnSave]}>Save</Text>
        </Pressable>
      ),
    });
  }, [isEdit, navigation, handleSave, handleCancel]);

  // ── Derived display values ─────────────────────────────────────────────────
  const freqLabel    = frequency.charAt(0).toUpperCase() + frequency.slice(1);
  const measureLabel = measureByLabel(kind, target, unit);

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Build / Break segmented control ────────────────────────── */}
        <View style={s.segWrap}>
          <View style={s.seg}>
            {(['build', 'break'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setGoalType(type)}
                style={[s.segBtn, goalType === type && s.segBtnActive]}
              >
                <Text style={[s.segText, goalType === type && s.segTextActive]}>
                  {type === 'build' ? 'Build a Habit' : 'Break a Habit'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Section 1: Name & Icon ──────────────────────────────────── */}
        <View style={s.section}>
          <Row
            label="Habit Name"
            value={name.trim() || 'Tap to set'}
            valueFaded={!name.trim()}
            onPress={() => navigation.navigate('HabitName')}
          />
          <Row
            label="Icon"
            value={icon}
            onPress={() => navigation.navigate('HabitIcon')}
            last
          />
        </View>

        {/* ── Section 2: Frequency & Measure By ──────────────────────── */}
        <View style={s.section}>
          <Row
            label="Frequency"
            value={freqLabel}
            onPress={() => navigation.navigate('Frequency')}
          />
          <Row
            label="Measure By"
            value={measureLabel}
            onPress={() => navigation.navigate('MeasureBy')}
            last
          />
        </View>

        {/* ── Section 3: Reminder ─────────────────────────────────────── */}
        <View style={s.section}>
          <View style={[s.row, !reminderEnabled && s.rowLast]}>
            <Text style={s.rowLabel}>Reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#E5E5EA', true: C.teal }}
              thumbColor="#fff"
            />
          </View>
          {reminderEnabled && (
            <Row
              label="Time"
              value={formatReminderTime(reminderTime)}
              onPress={() => navigation.navigate('Reminder')}
              last
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Row sub-component ────────────────────────────────────────────────────────

function Row({
  label, value, valueFaded = false, onPress, last = false,
}: {
  label: string;
  value: string;
  valueFaded?: boolean;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        last && s.rowLast,
        pressed && { backgroundColor: '#F2F2F7' },
      ]}
    >
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>
        <Text style={[s.rowValue, valueFaded && { color: '#C7C7CC' }]} numberOfLines={1}>
          {value}
        </Text>
        <ChevronRight size={20} color="#C7C7CC" strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { paddingBottom: 40 },

  // Header buttons
  headerBtn:     { fontSize: 17, color: C.teal },
  headerBtnSave: { fontWeight: '600' },

  // Build/Break segmented control
  segWrap: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  seg: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segBtnActive: { backgroundColor: C.teal },
  segText:      { fontSize: 15, fontWeight: '400', color: '#3C3C43' },
  segTextActive:{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  // Section card
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    minHeight: 44,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 17, color: '#1A1A1A', flexShrink: 0 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  rowValue: { fontSize: 17, color: '#8E8E93', flexShrink: 1 },
});
