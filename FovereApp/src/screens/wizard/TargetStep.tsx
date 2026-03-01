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
import { useTheme } from '@/context/ThemeContext';
import { useWizardStore } from '@/store/wizardStore';

type Props = NativeStackScreenProps<WizardStackParamList, 'Target'>;

export default function TargetStep({ navigation }: Props) {
  const { colors } = useTheme();
  const { target, unit, setTarget } = useWizardStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Target',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[s.doneBtn, { color: colors.teal }]}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.teal]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <Text style={[s.helper, { color: colors.text2 }]}>Set the quantity you want to reach each time.</Text>

      <View style={[s.card, { backgroundColor: colors.bgCard }]}>
        <View style={s.stepper}>
          <Pressable
            onPress={() => setTarget(Math.max(1, target - 1))}
            style={[s.stepBtn, target <= 1 && { opacity: 0.3 }]}
            disabled={target <= 1}
          >
            <Minus size={28} color={colors.teal} strokeWidth={2.5} />
          </Pressable>

          <View style={s.valueWrap}>
            <Text style={[s.value, { color: colors.text1 }]}>{target}</Text>
            {unit.trim() ? <Text style={[s.unit, { color: colors.text2 }]}>{unit.trim()}</Text> : null}
          </View>

          <Pressable onPress={() => setTarget(target + 1)} style={s.stepBtn}>
            <Plus size={28} color={colors.teal} strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  doneBtn: { fontSize: 17, fontWeight: '600' },

  helper: {
    fontSize: 15,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  card: {
    marginHorizontal: 16,
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
    letterSpacing: -1,
    lineHeight: 64,
  },
  unit: {
    fontSize: 17,
    marginTop: 4,
  },
});
