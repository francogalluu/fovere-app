import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';
import type { Frequency } from '@/types/habit';

type Props = NativeStackScreenProps<WizardStackParamList, 'Frequency'>;

const OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily',   label: 'Daily',   description: 'Track every day' },
  { value: 'weekly',  label: 'Weekly',  description: 'Track once a week' },
  { value: 'monthly', label: 'Monthly', description: 'Track once a month' },
];

export default function FrequencyStep({ navigation }: Props) {
  const frequency    = useWizardStore(s => s.frequency);
  const setFrequency = useWizardStore(s => s.setFrequency);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Frequency',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={s.doneBtn}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Text style={s.helper}>How often do you want to track this habit?</Text>

      <View style={s.card}>
        {OPTIONS.map((opt, i) => {
          const selected = frequency === opt.value;
          const last     = i === OPTIONS.length - 1;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setFrequency(opt.value)}
              style={({ pressed }) => [
                s.row,
                !last && s.rowBorder,
                pressed && { backgroundColor: '#F9F9F9' },
              ]}
            >
              <View style={s.rowText}>
                <Text style={s.label}>{opt.label}</Text>
                <Text style={s.desc}>{opt.description}</Text>
              </View>
              {selected && (
                <View style={s.checkCircle}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          );
        })}
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
  rowText: { flex: 1 },
  label:   { fontSize: 17, color: '#1A1A1A', fontWeight: '400' },
  desc:    { fontSize: 13, color: C.text2, marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
