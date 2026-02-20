/**
 * MeasureByStep — pick Completion (boolean) or Quantity (numeric).
 * When Quantity is selected, also shows target counter and unit field.
 */
import React, { useLayoutEffect } from 'react';
import {
  View, Text, Pressable, TextInput,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';

type Props = NativeStackScreenProps<WizardStackParamList, 'MeasureBy'>;

export default function MeasureByStep({ navigation }: Props) {
  const { kind, target, unit, setKind, setTarget, setUnit } = useWizardStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Measure By',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={s.doneBtn}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const handleDecrement = () => setTarget(Math.max(1, target - 1));
  const handleIncrement = () => setTarget(target + 1);

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
            {/* Completion option */}
            <Pressable
              onPress={() => setKind('boolean')}
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

            {/* Quantity option */}
            <Pressable
              onPress={() => setKind('numeric')}
              style={({ pressed }) => [s.row, pressed && { backgroundColor: '#F9F9F9' }]}
            >
              <View style={s.rowText}>
                <Text style={s.label}>Quantity</Text>
                <Text style={s.desc}>Count toward a numeric goal</Text>
              </View>
              {kind === 'numeric' && (
                <View style={s.checkCircle}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          </View>

          {/* ── Target & Unit (only when Quantity) ─────────────────────── */}
          {kind === 'numeric' && (
            <>
              <Text style={s.sectionLabel}>TARGET</Text>

              {/* Target stepper */}
              <View style={s.card}>
                <View style={[s.row, s.rowBorder]}>
                  <Text style={s.label}>Daily target</Text>
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

                {/* Unit input */}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F2F2F7' },
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
});
