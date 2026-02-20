import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<WizardStackParamList, 'Reminder'>;

export default function ReminderStep({ navigation: _navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Set a reminder</Text>
        <Text style={styles.sub}>Time picker + save — coming in M6</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
  sub: { fontSize: 15, color: '#8E8E93' },
});
