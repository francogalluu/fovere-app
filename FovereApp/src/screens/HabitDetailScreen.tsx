import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>;

export default function HabitDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Habit Detail</Text>
        <Text style={styles.sub}>ID: {id}</Text>
        <Text style={styles.sub}>Full detail view — coming in M5</Text>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  sub: { fontSize: 15, color: '#8E8E93' },
  back: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#008080', borderRadius: 12 },
  backText: { color: '#fff', fontWeight: '600' },
});
