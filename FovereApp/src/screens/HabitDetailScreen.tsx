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
import Svg, { Circle } from 'react-native-svg';
import { Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useHabitStore } from '@/store';
import { today } from '@/lib/dates';
import { getHabitCurrentValue, isHabitCompleted } from '@/lib/aggregates';
import { getProgressColor } from '@/lib/progressColors';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>;

const RING = 220;
const RING_R = 80;
const RING_CIRC = 2 * Math.PI * RING_R;

export default function HabitDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const habit          = useHabitStore(s => s.habits.find(h => h.id === id));
  const allEntries     = useHabitStore(s => s.entries);
  const incrementEntry = useHabitStore(s => s.incrementEntry);
  const decrementEntry = useHabitStore(s => s.decrementEntry);
  const logEntry       = useHabitStore(s => s.logEntry);
  const deleteEntry    = useHabitStore(s => s.deleteEntry);
  const deleteHabit    = useHabitStore(s => s.deleteHabit);

  const todayStr = today();

  const currentValue = useMemo(
    () => habit ? getHabitCurrentValue(habit, allEntries, todayStr) : 0,
    [habit, allEntries, todayStr],
  );

  const completed = useMemo(
    () => habit ? isHabitCompleted(habit, allEntries, todayStr) : false,
    [habit, allEntries, todayStr],
  );

  const progressPct       = habit ? Math.min((currentValue / habit.target) * 100, 100) : 0;
  const strokeDashoffset  = RING_CIRC * (1 - progressPct / 100);

  // Wire the navigation header title and Edit button
  useLayoutEffect(() => {
    if (!habit) return;
    navigation.setOptions({
      headerTitle: habit.name,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('EditHabit', { id: habit.id, screen: 'HabitType' })}
          hitSlop={8}
        >
          <Text style={s.headerEdit}>Edit</Text>
        </Pressable>
      ),
    });
  }, [habit, navigation]);

  const handleToggle = useCallback(() => {
    if (!habit) return;
    if (completed) deleteEntry(habit.id, todayStr);
    else logEntry(habit.id, todayStr, 1);
  }, [habit, completed, deleteEntry, logEntry, todayStr]);

  const handleIncrement = useCallback(() => {
    if (!habit || currentValue >= habit.target) return;
    incrementEntry(habit.id, todayStr);
  }, [habit, currentValue, incrementEntry, todayStr]);

  const handleDecrement = useCallback(() => {
    if (!habit || currentValue <= 0) return;
    decrementEntry(habit.id, todayStr);
  }, [habit, currentValue, decrementEntry, todayStr]);

  const handleDelete = () => {
    if (!habit) return;
    Alert.alert(
      'Delete Habit',
      `"${habit.name}" and all its history will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { deleteHabit(id); navigation.goBack(); },
        },
      ],
    );
  };

  if (!habit) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom']}>
        <View style={s.notFound}>
          <Text style={s.notFoundText}>Habit not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const freqLabel    = habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1);
  const goalLabel    = habit.frequency === 'daily' ? "Today's Goal" :
                       habit.frequency === 'weekly' ? "This Week's Goal" : "This Month's Goal";
  const measureLabel = habit.kind === 'boolean' ? 'Yes / No' :
                       habit.unit ? `Count (${habit.unit})` : 'Count';

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Progress ring ─────────────────────────────────────────────── */}
        <View style={s.ringSection}>
          <View style={{ width: RING, height: RING }}>
            <Svg
              width={RING}
              height={RING}
              viewBox={`0 0 ${RING} ${RING}`}
              style={{ transform: [{ rotate: '-90deg' }] }}
            >
              <Circle
                cx={RING / 2} cy={RING / 2} r={RING_R}
                fill="none" stroke="#E5E5E5" strokeWidth={12}
              />
              <Circle
                cx={RING / 2} cy={RING / 2} r={RING_R}
                fill="none"
                stroke={completed ? '#008080' : getProgressColor(progressPct)}
                strokeWidth={12}
                strokeDasharray={RING_CIRC}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
            {/* Center text */}
            <View style={StyleSheet.absoluteFillObject}>
              <View style={s.ringCenter}>
                {habit.kind === 'boolean' ? (
                  <Text style={[s.ringBoolMark, { color: completed ? '#008080' : '#C7C7CC' }]}>
                    {completed ? '✓' : '○'}
                  </Text>
                ) : (
                  <Text>
                    <Text style={s.ringCurrent}>{currentValue}</Text>
                    <Text style={s.ringTarget}>/{habit.target}</Text>
                  </Text>
                )}
                {habit.kind === 'numeric' && habit.unit ? (
                  <Text style={s.ringUnit}>{habit.unit}</Text>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={s.goalLabel}>{goalLabel}</Text>
        </View>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        {habit.kind === 'boolean' ? (
          <View style={s.boolRow}>
            <Pressable
              onPress={handleToggle}
              style={({ pressed }) => [
                s.boolBtn,
                completed && s.boolBtnDone,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={[s.boolBtnText, completed && s.boolBtnTextDone]}>
                {completed ? 'Done ✓' : 'Mark Done'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.numRow}>
            <Pressable
              onPress={handleDecrement}
              disabled={currentValue === 0}
              style={[s.ctrlBtn, currentValue === 0 && s.ctrlBtnDisabled]}
            >
              <Minus size={24} color="#008080" strokeWidth={2.5} />
            </Pressable>

            <Text style={s.numValue}>{currentValue}</Text>

            <Pressable
              onPress={handleIncrement}
              disabled={currentValue >= habit.target}
              style={[s.ctrlBtnPrimary, currentValue >= habit.target && s.ctrlBtnDisabled]}
            >
              <Plus size={24} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        {/* ── Info rows ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.infoCard}>
            <InfoRow label="Frequency"   value={freqLabel}    last={false} />
            <InfoRow label="Measurement" value={measureLabel} last={false} />
            <InfoRow
              label="Target"
              value={`${habit.target}${habit.unit ? ' ' + habit.unit : ''}`}
              last={true}
            />
          </View>
        </View>

        {/* ── Delete ────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [s.deleteCard, pressed && { opacity: 0.7 }]}
          >
            <Text style={s.deleteText}>Delete Habit</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function InfoRow({ label, value, last }: { label: string; value: string; last: boolean }) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
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

  // Ring
  ringSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 4 },
  ringCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringBoolMark:{ fontSize: 64, fontWeight: '300' },
  ringCurrent: { fontSize: 48, fontWeight: '300', color: '#1A1A1A' },
  ringTarget:  { fontSize: 32, color: '#999' },
  ringUnit:    { fontSize: 15, color: '#999', marginTop: 4 },
  goalLabel:   { fontSize: 17, color: '#666', marginTop: 8, marginBottom: 24 },

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

  // Delete
  deleteCard: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  deleteText: { fontSize: 17, color: '#FF3B30' },
});
