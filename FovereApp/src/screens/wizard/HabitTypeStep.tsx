/**
 * HabitTypeStep — the wizard's entry screen / summary form.
 * Build/break choice is made earlier (add-habit sheet); goalType comes from store.
 *   • Cancel (left) | title | Save (right)  — configured via navigation header
 *   • Section 1: Habit Name, Icon, Description — chevron rows → sub-steps
 *   • Section 2: Frequency, Measure By     — chevron rows → sub-steps
 *   • Section 3: Reminder toggle, Time row  — inline toggle + conditional row
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

import { useTranslation } from 'react-i18next';
import { useHabitStore } from '@/store';
import { useWizardStore } from '@/store/wizardStore';
import { useTheme } from '@/context/ThemeContext';

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

function measureByLabel(kind: 'boolean' | 'numeric', target: number, unit: string, t: (k: string) => string): string {
  if (kind === 'boolean') return t('wizard.completion');
  const n = target > 0 ? target : 1;
  return unit.trim() ? `${n} ${unit.trim()}` : String(n);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HabitTypeStep({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  // ── Wizard store ───────────────────────────────────────────────────────────
  const {
    habitId, goalType, name, icon, description, kind, frequency,
    target, unit, reminderEnabled, reminderTime, reminderWeekdays, reminderDayOfMonth,
    reset, loadHabit,
    setReminderEnabled,
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
    // New habit: reset only when store is still empty (e.g. direct open).
    // Do not reset when pre-filled from predetermined picker (name already set).
    if (!habitId && !name.trim()) reset();
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
      Alert.alert(t('wizard.nameRequiredTitle'), t('wizard.nameRequiredMessage'));
      return;
    }
    const resolvedTarget = kind === 'boolean' ? 1 : Math.max(1, target);
    const resolvedUnit   = kind === 'boolean' ? undefined : (unit.trim() || undefined);
    const resolvedReminder = reminderEnabled ? reminderTime : undefined;
    const resolvedWeekdays = reminderEnabled && frequency === 'weekly' ? reminderWeekdays : undefined;
    const resolvedDayOfMonth = reminderEnabled && frequency === 'monthly' ? reminderDayOfMonth : undefined;

    const resolvedDescription = description.trim() || undefined;

    const reminderPatch = {
      reminderTime: resolvedReminder,
      reminderWeekdays: resolvedWeekdays,
      reminderDayOfMonth: resolvedDayOfMonth,
    };

    if (isEdit && habitId) {
      updateHabit(habitId, {
        goalType,
        name: trimmed,
        icon,
        description: resolvedDescription,
        kind,
        frequency,
        target: resolvedTarget,
        unit:   resolvedUnit,
        ...reminderPatch,
      });
    } else {
      addHabit({
        goalType,
        name: trimmed,
        icon,
        description: resolvedDescription,
        kind,
        frequency,
        target: resolvedTarget,
        unit:   resolvedUnit,
        ...reminderPatch,
      });
    }
    reset();
    navigation.getParent()?.goBack();
  }, [name, icon, description, kind, frequency, target, unit, reminderEnabled, reminderTime, reminderWeekdays, reminderDayOfMonth, isEdit, habitId, addHabit, updateHabit, reset, navigation]);

  // ── Header buttons ─────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('wizard.editHabit') : t('wizard.newHabit'),
      headerLeft: () => (
        <Pressable onPress={handleCancel} hitSlop={8}>
          <Text style={[s.headerBtn, { color: colors.teal }]}>{t('wizard.cancel')}</Text>
        </Pressable>
      ),
      headerRight: () => (
        <View style={s.headerRightWrap}>
          <Pressable onPress={handleSave} hitSlop={8}>
            <Text style={[s.headerBtn, s.headerBtnSave, { color: colors.teal }]}>{t('wizard.save')}</Text>
          </Pressable>
        </View>
      ),
      headerRightContainerStyle: s.headerRightContainer,
    });
  }, [isEdit, navigation, handleSave, handleCancel, colors.teal, t]);

  // ── Derived display values ─────────────────────────────────────────────────
  const freqLabel    = frequency === 'daily' ? t('wizard.frequencyDaily') : frequency === 'weekly' ? t('wizard.frequencyWeekly') : t('wizard.frequencyMonthly');
  const measureLabel = measureByLabel(kind, target, unit, t);

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Section 1: Name & Icon ──────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: colors.bgCard }]}>
          <Row
            label={t('wizard.name')}
            value={name.trim() || t('wizard.namePlaceholder')}
            valueFaded={!name.trim()}
            onPress={() => navigation.navigate('HabitName')}
          />
          <Row
            label={t('wizard.icon')}
            value={icon}
            onPress={() => navigation.navigate('HabitIcon')}
          />
          <Row
            label={t('wizard.description')}
            value={description.trim() || t('wizard.descriptionPlaceholderShort')}
            valueFaded={!description.trim()}
            onPress={() => navigation.navigate('Description')}
            last
          />
        </View>

        {/* ── Section 2: Frequency & Measure By ──────────────────────── */}
        <View style={[s.section, { backgroundColor: colors.bgCard }]}>
          <Row
            label={t('wizard.frequency')}
            value={freqLabel}
            onPress={() => navigation.navigate('Frequency')}
          />
          <Row
            label={t('wizard.measureBy')}
            value={measureLabel}
            onPress={() => navigation.navigate('MeasureBy')}
            last
          />
        </View>

        {/* ── Section 3: Reminder ─────────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: colors.bgCard }]}>
          <View style={[s.row, { backgroundColor: colors.bgCard, borderBottomColor: colors.separator }, !reminderEnabled && s.rowLast]}>
            <Text style={[s.rowLabel, { color: colors.text1 }]}>{t('wizard.reminder')}</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: colors.separatorLight, true: colors.teal }}
              thumbColor={colors.white}
            />
          </View>
          {reminderEnabled && (
            <Row
              label={t('wizard.timeLabel')}
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
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        { backgroundColor: colors.bgCard, borderBottomColor: colors.separator },
        last && s.rowLast,
        pressed && { backgroundColor: colors.bgSecondary },
      ]}
    >
      <Text style={[s.rowLabel, { color: colors.text1 }]}>{label}</Text>
      <View style={s.rowRight}>
        <Text style={[s.rowValue, { color: colors.text2 }, valueFaded && { color: colors.chevron }]} numberOfLines={1}>
          {value}
        </Text>
        <ChevronRight size={20} color={colors.chevron} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingTop: 24, paddingBottom: 40 },

  // Header buttons — container gets flex so Save aligns to the right edge
  headerRightContainer: { flex: 1, justifyContent: 'center' },
  headerRightWrap: {
    flexDirection: 'row',
    marginLeft: 'auto',
    alignItems: 'center',
    paddingRight: 4,
  },
  headerBtn:     { fontSize: 17 },
  headerBtnSave: { fontWeight: '600' },

  // Section card
  section: {
    marginHorizontal: 16,
    marginTop: 16,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 17, flexShrink: 0 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginLeft: 16 },
  rowValue: { fontSize: 17, flexShrink: 1 },
});
