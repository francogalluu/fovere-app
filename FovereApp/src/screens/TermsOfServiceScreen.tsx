import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';

export default function TermsOfServiceScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: colors.text1 }]}>Terms of Service</Text>
        <Text style={[s.meta, { color: colors.text3 }]}>Last updated: March 2, 2026</Text>

        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          <Text style={[s.paragraph, { color: colors.text1 }]}>
            By using Fovere, you agree to these Terms of Service.
          </Text>

          <Text style={[s.paragraph, { color: colors.text1 }]}>
            Fovere is provided by me, Franco Galluzzo, on an &quot;as is&quot; and &quot;as
            available&quot; basis, without warranties of any kind, whether express or implied,
            including but not limited to warranties of merchantability, fitness for a particular
            purpose, and non-infringement.
          </Text>

          <Text style={[s.paragraph, { color: colors.text1 }]}>
            You are responsible for any data you enter into the app and for maintaining backups of
            your device. I am not liable for any loss of data, productivity, or other damages
            arising from your use of Fovere.
          </Text>

          <Text style={[s.paragraph, { color: colors.text1 }]}>
            I may update these terms from time to time. If I make material changes, I will update
            the &quot;Last updated&quot; date above. Your continued use of Fovere after any
            changes take effect constitutes acceptance of the new terms.
          </Text>

          <Text style={[s.paragraph, { color: colors.text1 }]}>
            For questions about these terms, contact me at:{' '}
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

