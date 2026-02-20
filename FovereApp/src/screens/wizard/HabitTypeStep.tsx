import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<WizardStackParamList, 'HabitType'>;

export default function HabitTypeStep({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose type</Text>
        <Text style={styles.sub}>Boolean or numeric — coming in M6</Text>
        <Pressable style={styles.next} onPress={() => navigation.navigate('HabitName')}>
          <Text style={styles.nextText}>Next →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A' },
  sub: { fontSize: 15, color: '#8E8E93' },
  next: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: '#008080', borderRadius: 14 },
  nextText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
