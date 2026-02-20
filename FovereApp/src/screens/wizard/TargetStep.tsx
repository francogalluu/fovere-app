/**
 * TargetStep — standalone numeric target setter.
 * Still registered in WizardNavigator but in the new flow the target
 * is primarily set inside MeasureByStep. This screen stays for deep-link
 * compatibility and direct navigation if needed.
 */
import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';

type Props = NativeStackScreenProps<WizardStackParamList, 'Target'>;

export default function TargetStep({ navigation }: Props) {
  const { target, unit, setTarget } = useWizardStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Target',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={s.doneBtn}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Text style={s.helper}>Set the quantity you want to reach each time.</Text>

      <View style={s.card}>
        <View style={s.stepper}>
          <Pressable
            onPress={() => setTarget(Math.max(1, target - 1))}
            style={[s.stepBtn, target <= 1 && { opacity: 0.3 }]}
            disabled={target <= 1}
          >
            <Minus size={28} color={C.teal} strokeWidth={2.5} />
          </Pressable>

          <View style={s.valueWrap}>
            <Text style={s.value}>{target}</Text>
            {unit.trim() ? <Text style={s.unit}>{unit.trim()}</Text> : null}
          </View>

          <Pressable onPress={() => setTarget(target + 1)} style={s.stepBtn}>
            <Plus size={28} color={C.teal} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F2F2F7' },
  doneBtn: { fontSize: 17, fontWeight: '600', color: C.teal },

  helper: {
    fontSize: 15,
    color: C.text2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  stepBtn:   { padding: 8 },
  valueWrap: { alignItems: 'center', minWidth: 80 },
  value: {
    fontSize: 56,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -1,
    lineHeight: 64,
  },
  unit: {
    fontSize: 17,
    color: C.text2,
    marginTop: 4,
  },
});
