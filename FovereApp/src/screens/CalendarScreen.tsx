import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function CalendarScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.sub}>Completion history — coming in M7</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  sub: { fontSize: 15, color: '#8E8E93', marginTop: 8 },
});
