import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/context/ThemeContext';

export default function HabitsScoringScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const section = (titleKey: string, paragraphKeys: string[]) => (
    <View key={titleKey} style={[s.card, { backgroundColor: colors.bgCard }]}>
      <Text style={[s.sectionTitle, { color: colors.text1 }]}>{t(`habitsScoring.${titleKey}`)}</Text>
      {paragraphKeys.map((key) => (
        <Text key={key} style={[s.paragraph, { color: colors.text1 }]}>
          {t(`habitsScoring.${key}`)}
        </Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: colors.text1 }]}>{t('habitsScoring.title')}</Text>

        {section('pointsTitle', ['pointsIntro', 'pointsGood', 'pointsBad'])}

        {section('badHabitsTitle', [
          'badHabitsIntro',
          'badHabitsDaily',
          'badHabitsWeekly',
          'badHabitsMonthly',
          'badHabitsBoolean',
        ])}

        {section('penaltiesTitle', ['penaltiesIntro', 'penaltiesFormula', 'penaltiesExample'])}

        {section('weeklyHabitsTitle', ['weeklyHabitsIntro', 'weeklyHabitsProgress', 'weeklyHabitsReminder'])}

        {section('monthlyHabitsTitle', ['monthlyHabitsIntro'])}

        {section('dailyHabitsTitle', ['dailyHabitsIntro'])}

        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.paragraph, { color: colors.text1 }]}>{t('habitsScoring.homeRingNote')}</Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
});
