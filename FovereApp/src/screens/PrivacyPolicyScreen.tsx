import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: colors.text1 }]}>Privacy Policy</Text>
        <Text style={[s.meta, { color: colors.text3 }]}>Last updated: March 2, 2026</Text>

        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.paragraph, { color: colors.text1 }]}>
            Fovere is developed and operated by me, Franco Galluzzo.
          </Text>
          <Text style={[s.paragraph, { color: colors.text1 }]}>
            Fovere does not collect, store, or process any personal data on external servers. All
            data you enter into the app (such as your habits and usage history) is stored locally
            on your device and remains under your control. I do not operate a backend server for
            Fovere, and I do not transmit your data to myself or to any third parties.
          </Text>

          <Text style={[s.paragraph, { color: colors.text1 }]}>
            The app may use platform features such as local notifications to remind you about your
            habits. These notifications are scheduled and handled by your device; the content of
            your reminders is not sent to any servers that I control.
          </Text>

          <Text style={[s.paragraph, { color: colors.text1 }]}>
            I do not use analytics, advertising, or tracking technologies in Fovere.
          </Text>

          <Text style={[s.paragraph, { color: colors.text1 }]}>
            If you have any questions about this policy, you can contact me at:{' '}
            <Text style={[s.link, { color: colors.teal }]}>fovereapp@gmail.com</Text>.
          </Text>
        </View>
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
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    padding: 16,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  link: {
    fontWeight: '600',
  },
});

