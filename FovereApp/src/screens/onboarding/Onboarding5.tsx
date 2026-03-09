import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import type { RootStackParamList, OnboardingCategory } from '@/navigation/types';
import { C, F, R, S } from '@/lib/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding5'>;

const CATEGORIES: { key: OnboardingCategory; label: string; emoji: string }[] = [
  { key: 'health-fitness', label: 'Health & Fitness', emoji: '❤️' },
  { key: 'mind-mood', label: 'Mind & Mood', emoji: '🧘' },
  { key: 'career-study', label: 'Career & Study', emoji: '🎯' },
  { key: 'home-organization', label: 'Home & Organization', emoji: '🏠' },
  { key: 'finances', label: 'Finances', emoji: '💰' },
  { key: 'relationships', label: 'Relationships', emoji: '👥' },
  { key: 'creativity-hobbies', label: 'Creativity & Hobbies', emoji: '🎨' },
];

export default function Onboarding5() {
  const navigation = useNavigation<Nav>();

  const handleSelect = useCallback(
    (category: OnboardingCategory) => {
      navigation.navigate('NewHabit', {
        screen: 'HabitSource',
        params: {
          onboardingCategory: category,
        },
      });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.container}>
        <View style={s.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={({ pressed }) => [s.backButton, pressed && s.backButtonPressed]}
          >
            <ChevronLeft size={22} color={C.text1} />
          </Pressable>

          <View style={s.progressWrap}>
            {Array.from({ length: 5 }).map((_, index) => {
              const active = index <= 4;
              return <View key={index} style={[s.progressDot, active && s.progressDotActive]} />;
            })}
          </View>
        </View>

        <View style={s.content}>
          <Text style={s.title}>What area of your life is calling for a little attention?</Text>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat.key}
                onPress={() => handleSelect(cat.key)}
                style={({ pressed }) => [s.card, pressed && s.cardPressed]}
              >
                <Text style={s.cardEmoji}>{cat.emoji}</Text>
                <Text style={s.cardLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bgHome,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 26,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.separatorLight,
  },
  progressDotActive: {
    backgroundColor: C.teal,
  },
  content: {
    flex: 1,
    paddingTop: 32,
  },
  title: {
    fontSize: F.sectionTitle,
    fontWeight: '700',
    color: C.text1,
    marginBottom: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: C.bgCard,
    borderRadius: R.cardSm,
    marginBottom: 12,
    ...S.card,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  cardLabel: {
    flex: 1,
    fontSize: F.label,
    fontWeight: '600',
    color: C.text1,
  },
});

