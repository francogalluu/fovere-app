/**
 * MeasureByStep — pick Completion (boolean), Quantity (numeric), or Time (duration).
 * When Quantity is selected: target stepper + unit field.
 * When Time is selected: native iOS countdown wheel on iOS; hours+minutes stepper on Android.
 */
import React, { useLayoutEffect, useMemo } from 'react';
import {
  View, Text, Pressable, TextInput,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Check, Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';

type Props = NativeStackScreenProps<WizardStackParamList, 'MeasureBy'>;

/** True when measure-by is "Time" (numeric + unit min) */
function isTimeMode(kind: string, unit: string): boolean {
  return kind === 'numeric' && unit.trim().toLowerCase() === 'min';
}

const MAX_DURATION_MINUTES = 24 * 60; // 24 hours

/** 2001-01-01 00:00 UTC in ms. Unpatched native sends ref + duration. */
const IOS_COUNTDOWN_REF_MS = 978307200 * 1000;

/**
 * Value for iOS countdown picker. Use "midnight today (local) + duration" so the wheel shows
 * 0h N min in all timezones. (UTC ref + duration shows as 21h in UTC−3 etc.)
 */
function minutesToCountdownDate(minutes: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setTime(d.getTime() + Math.max(0, Math.floor(minutes)) * 60 * 1000);
  return d;
}

/**
 * Midnight today (local) in ms. Used when we pass "midnight + duration" as value.
 */
function getMidnightTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * iOS countdown onChange: native may send
 * (A) duration in ms (patched) e.g. 120000 for 2 min
 * (B) reference 2001 + duration in ms (unpatched) e.g. 978307320000 for 2 min
 * (C) midnight today (local) + duration in ms (when we pass that as value) e.g. midnightToday + 120000
 */
function countdownTimestampToMinutes(timestamp: number): number {
  const refMs = IOS_COUNTDOWN_REF_MS;
  const maxDurationMs = MAX_DURATION_MINUTES * 60 * 1000;
  const midnightToday = getMidnightTodayMs();

  let minutes: number;
  if (timestamp >= refMs && timestamp <= refMs + maxDurationMs) {
    minutes = Math.round((timestamp - refMs) / 60000);
  } else if (timestamp >= midnightToday && timestamp <= midnightToday + maxDurationMs) {
    minutes = Math.round((timestamp - midnightToday) / 60000);
  } else {
    minutes = Math.round(timestamp / 60000);
  }
  if (minutes < 1 || Number.isNaN(minutes)) return 1;
  return Math.min(MAX_DURATION_MINUTES, minutes);
}

/** Split total minutes into hours and minutes (for Android stepper). */
function totalMinutesToHoursMinutes(total: number): { hours: number; minutes: number } {
  const t = Math.max(0, Math.floor(total));
  const hours = Math.min(24, Math.floor(t / 60));
  const minutes = hours === 24 ? 0 : t % 60;
  return { hours, minutes };
}

export default function MeasureByStep({ navigation }: Props) {
  const { kind, target, unit, goalType, setKind, setTarget, setUnit } = useWizardStore();
  const timeMode = isTimeMode(kind, unit);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Measure By',
      headerRight: () => (
        <View style={s.doneBtnWrap}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={s.doneBtn}>Done</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);

  const handleDecrement = () => setTarget(Math.max(1, target - 1));
  const handleIncrement = () => setTarget(target + 1);

  const selectCompletion = () => setKind('boolean');
  const selectQuantity = () => {
    setKind('numeric');
    if (unit.trim().toLowerCase() === 'min') setUnit('');
  };
  const selectTime = () => {
    setKind('numeric');
    setUnit('min');
    if (target < 1) setTarget(30);
  };

  const countdownValue = useMemo(() => minutesToCountdownDate(target), [target]);
  const onCountdownChange = (event: { nativeEvent?: { timestamp?: number } }) => {
    const ts = event?.nativeEvent?.timestamp;
    if (typeof ts === 'number') setTarget(countdownTimestampToMinutes(ts));
  };

  const { hours, minutes: mins } = useMemo(
    () => totalMinutesToHoursMinutes(target),
    [target],
  );
  const setDuration = (h: number, m: number) => {
    const total = h * 60 + m;
    setTarget(total < 1 ? 1 : Math.min(MAX_DURATION_MINUTES, total));
  };
  const changeHours = (delta: number) => setDuration(Math.max(0, Math.min(24, hours + delta)), hours + delta === 24 ? 0 : mins);
  const changeMinutes = (delta: number) => {
    let m = mins + delta;
    let h = hours;
    if (m < 0) {
      m += 60;
      h -= 1;
    } else if (m >= 60) {
      m -= 60;
      h += 1;
    }
    if (h === 24 && m > 0) {
      h = 23;
      m = 59;
    }
    h = Math.max(0, Math.min(24, h));
    if (h === 24) m = 0;
    setDuration(h, m);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.helper}>How will you measure progress?</Text>

          {/* ── Kind selector ──────────────────────────────────────────── */}
          <View style={s.card}>
            {/* Completion */}
            <Pressable
              onPress={selectCompletion}
              style={({ pressed }) => [s.row, s.rowBorder, pressed && { backgroundColor: '#F9F9F9' }]}
            >
              <View style={s.rowText}>
                <Text style={s.label}>Completion</Text>
                <Text style={s.desc}>Done / not done — simple toggle</Text>
              </View>
              {kind === 'boolean' && (
                <View style={s.checkCircle}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>

            {/* Quantity */}
            <Pressable
              onPress={selectQuantity}
              style={({ pressed }) => [s.row, s.rowBorder, pressed && { backgroundColor: '#F9F9F9' }]}
            >
              <View style={s.rowText}>
                <Text style={s.label}>Quantity</Text>
                <Text style={s.desc}>Count toward a numeric goal</Text>
              </View>
              {kind === 'numeric' && !timeMode && (
                <View style={s.checkCircle}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>

            {/* Time */}
            <Pressable
              onPress={selectTime}
              style={({ pressed }) => [s.row, pressed && { backgroundColor: '#F9F9F9' }]}
            >
              <View style={s.rowText}>
                <Text style={s.label}>Time</Text>
                <Text style={s.desc}>Track duration (e.g. 30 min meditation)</Text>
              </View>
              {timeMode && (
                <View style={s.checkCircle}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          </View>

          {/* ── Target: Quantity (stepper + unit) ───────────────────────── */}
          {kind === 'numeric' && !timeMode && (
            <>
              <Text style={s.sectionLabel}>TARGET</Text>
              <View style={s.card}>
                <View style={[s.row, s.rowBorder]}>
                  <Text style={s.label}>{goalType === 'break' ? 'Daily limit' : 'Daily target'}</Text>
                  <View style={s.stepper}>
                    <Pressable onPress={handleDecrement} style={s.stepBtn}>
                      <Minus size={18} color={target <= 1 ? '#C7C7CC' : C.teal} strokeWidth={2.5} />
                    </Pressable>
                    <Text style={s.stepValue}>{target}</Text>
                    <Pressable onPress={handleIncrement} style={s.stepBtn}>
                      <Plus size={18} color={C.teal} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                </View>
                <View style={[s.row]}>
                  <Text style={s.label}>Unit</Text>
                  <TextInput
                    style={s.unitInput}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="min, glasses, pages…"
                    placeholderTextColor="#C7C7CC"
                    returnKeyType="done"
                    maxLength={20}
                    textAlign="right"
                  />
                </View>
              </View>
            </>
          )}

          {/* ── Target: Time — iOS native countdown wheel; Android hours+minutes stepper ───── */}
          {timeMode && (
            <>
              <Text style={s.sectionLabel}>DURATION</Text>
              <View style={s.card}>
                {Platform.OS === 'ios' ? (
                  <>
                    <View style={s.timePickerWrap}>
                      <DateTimePicker
                        value={countdownValue}
                        mode="countdown"
                        onChange={onCountdownChange}
                        display="spinner"
                        minuteInterval={1}
                        style={s.timePicker}
                      />
                    </View>
                    <View style={[s.row, s.durationSummary]}>
                      <Text style={s.durationSummaryText}>{target} min</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[s.row, s.rowBorder]}>
                      <Text style={s.label}>Hours</Text>
                      <View style={s.stepper}>
                        <Pressable onPress={() => changeHours(-1)} style={s.stepBtn} disabled={hours <= 0}>
                          <Minus size={18} color={hours <= 0 ? '#C7C7CC' : C.teal} strokeWidth={2.5} />
                        </Pressable>
                        <Text style={s.stepValue}>{hours}</Text>
                        <Pressable onPress={() => changeHours(1)} style={s.stepBtn} disabled={hours >= 24}>
                          <Plus size={18} color={hours >= 24 ? '#C7C7CC' : C.teal} strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={[s.row]}>
                      <Text style={s.label}>Minutes</Text>
                      <View style={s.stepper}>
                        <Pressable onPress={() => changeMinutes(-1)} style={s.stepBtn} disabled={target <= 1}>
                          <Minus size={18} color={target <= 1 ? '#C7C7CC' : C.teal} strokeWidth={2.5} />
                        </Pressable>
                        <Text style={s.stepValue}>{mins}</Text>
                        <Pressable onPress={() => changeMinutes(1)} style={s.stepBtn} disabled={hours >= 24 || (hours >= 23 && mins >= 59)}>
                          <Plus size={18} color={hours >= 24 || (hours >= 23 && mins >= 59) ? '#C7C7CC' : C.teal} strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={[s.row, s.durationSummary]}>
                      <Text style={s.durationSummaryText}>
                        {hours}h {mins}m ({target} min)
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F2F2F7' },
  doneBtnWrap: { marginLeft: 'auto', paddingRight: 4 },
  doneBtn: { fontSize: 17, fontWeight: '600', color: C.teal },
  scroll:  { paddingBottom: 40 },

  helper: {
    fontSize: 15,
    color: C.text2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 13, color: '#6D6D72',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowText:   { flex: 1 },
  label:     { fontSize: 17, color: '#1A1A1A', fontWeight: '400' },
  desc:      { fontSize: 13, color: C.text2, marginTop: 2 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.teal,
    alignItems: 'center', justifyContent: 'center',
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepBtn:   { padding: 4 },
  stepValue: {
    fontSize: 20, fontWeight: '600', color: '#1A1A1A',
    minWidth: 36, textAlign: 'center',
  },

  // Unit input
  unitInput: {
    fontSize: 17,
    color: '#8E8E93',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 16,
    paddingVertical: 0,
  },

  timePickerWrap: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  timePicker: {
    width: '100%',
    height: 180,
  },
  durationSummary: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  durationSummaryText: {
    fontSize: 15,
    color: C.text2,
  },
});
