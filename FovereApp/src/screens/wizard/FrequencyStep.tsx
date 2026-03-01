import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useTheme } from '@/context/ThemeContext';
import { useWizardStore } from '@/store/wizardStore';
import type { Frequency } from '@/types/habit';

type Props = NativeStackScreenProps<WizardStackParamList, 'Frequency'>;

const OPTIONS: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily',   label: 'Daily',   description: 'Track every day' },
  { value: 'weekly',  label: 'Weekly',  description: 'Track once a week' },
  { value: 'monthly', label: 'Monthly', description: 'Track once a month' },
];

export default function FrequencyStep({ navigation }: Props) {
  const { colors } = useTheme();
  const frequency    = useWizardStore(s => s.frequency);
  const setFrequency = useWizardStore(s => s.setFrequency);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Frequency',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[s.doneBtn, { color: colors.teal }]}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.teal]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <Text style={[s.helper, { color: colors.text2 }]}>How often do you want to track this habit?</Text>

      <View style={[s.card, { backgroundColor: colors.bgCard }]}>
        {OPTIONS.map((opt, i) => {
          const selected = frequency === opt.value;
          const last     = i === OPTIONS.length - 1;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setFrequency(opt.value)}
              style={({ pressed }) => [
                s.row,
                !last && [s.rowBorder, { borderBottomColor: colors.separator }],
                pressed && { backgroundColor: colors.bgAnalytics },
              ]}
            >
              <View style={s.rowText}>
                <Text style={[s.label, { color: colors.text1 }]}>{opt.label}</Text>
                <Text style={[s.desc, { color: colors.text2 }]}>{opt.description}</Text>
              </View>
              {selected && (
                <View style={[s.checkCircle, { backgroundColor: colors.teal }]}>
                  <Check size={14} color={colors.white} strokeWidth={3} />
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
  },
  rowText: { flex: 1 },
  label:   { fontSize: 17, fontWeight: '400' },
  desc:    { fontSize: 13, marginTop: 2 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
