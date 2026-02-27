import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useHabitStore } from '@/store';

export default function DeletedHabitsScreen() {
  const habits = useHabitStore(s => s.habits);
  const unarchiveHabit = useHabitStore(s => s.unarchiveHabit);

  const [query, setQuery] = useState('');

  const deletedHabits = useMemo(
    () =>
      habits
        .filter(h => h.archivedAt && !h.pausedAt)
        .sort((a, b) => (b.archivedAt! > a.archivedAt! ? 1 : -1)),
    [habits],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return deletedHabits;
    return deletedHabits.filter(h => h.name.toLowerCase().includes(q));
  }, [deletedHabits, query]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.card}>
          <TextInput
            placeholder="Search deleted habits"
            placeholderTextColor="#A1A1A6"
            value={query}
            onChangeText={setQuery}
            style={s.searchInput}
          />
          {filtered.length === 0 ? (
            <Text style={s.emptyText}>No deleted habits.</Text>
          ) : (
            filtered.map(h => (
              <View key={h.id} style={s.row}>
                <View style={s.left}>
                  <Text style={s.icon}>{h.icon}</Text>
                  <Text style={s.name} numberOfLines={1}>
                    {h.name}
                  </Text>
                </View>
                <Pressable
                  onPress={() => unarchiveHabit(h.id)}
                  style={({ pressed }) => [
                    s.restoreBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={s.restoreText}>Reactivate</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#F2F2F7',
  },
  emptyText: {
    paddingVertical: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#008080',
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

