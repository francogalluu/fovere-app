import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import type { RootStackParamList } from '@/navigation/types';
import { C, F, R } from '@/lib/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding4'>;

export default function Onboarding4() {
  const navigation = useNavigation<Nav>();

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
              const active = index <= 3;
              return <View key={index} style={[s.progressDot, active && s.progressDotActive]} />;
            })}
          </View>
        </View>

        <View style={s.content}>
          <Text style={s.title}>Build habits that actually last</Text>

          <View style={s.tip}>
            <View style={s.bulletCircle}>
              <Text style={s.bulletNumber}>1</Text>
            </View>
            <View style={s.tipTextWrap}>
              <Text style={s.tipTitle}>Start small</Text>
              <Text style={s.tipBody}>
                Pick one habit so easy you can&apos;t say no. The smaller the start, the stronger the foundation.
              </Text>
            </View>
          </View>

          <View style={s.tip}>
            <View style={s.bulletCircle}>
              <Text style={s.bulletNumber}>2</Text>
            </View>
            <View style={s.tipTextWrap}>
              <Text style={s.tipTitle}>Show up, not perfect</Text>
              <Text style={s.tipBody}>
                Missing once is okay. Missing twice becomes a pattern. Consistency beats intensity every time.
              </Text>
            </View>
          </View>

          <View style={s.tip}>
            <View style={s.bulletCircle}>
              <Text style={s.bulletNumber}>3</Text>
            </View>
            <View style={s.tipTextWrap}>
              <Text style={s.tipTitle}>Let it grow</Text>
              <Text style={s.tipBody}>
                Every check‑in compounds. In a few weeks you&apos;ll look back and be surprised by your progress.
              </Text>
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Pressable
            onPress={() => navigation.navigate('Onboarding5')}
            style={({ pressed }) => [s.primaryButton, pressed && s.primaryButtonPressed]}
          >
            <Text style={s.primaryButtonText}>I&apos;m ready</Text>
          </Pressable>
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
    fontSize: F.screenTitle,
    fontWeight: '700',
    color: C.text1,
    marginBottom: 28,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bulletCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bulletNumber: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    fontSize: F.label,
    fontWeight: '600',
    color: C.text1,
    marginBottom: 4,
  },
  tipBody: {
    fontSize: F.body,
    color: C.text3,
  },
  footer: {
    paddingBottom: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: C.teal,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: R.pill,
    ...{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

