import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/context/ThemeContext';
import { useHabitStore } from '@/store';

type Nav = NativeStackNavigationProp<RootStackParamList, 'HabitReminders'>;

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function HabitRemindersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const habits = useHabitStore(s => s.habits);
  const withReminder = habits.filter(h => h.reminderTime);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.scroll}>
        {withReminder.length === 0 ? (
          <Text style={[s.empty, { color: colors.text2 }]}>{t('habitReminders.empty')}</Text>
        ) : (
          <View style={[s.card, { backgroundColor: colors.bgCard }]}>
            {withReminder.map((habit, index) => (
              <Pressable
                key={habit.id}
                onPress={() => navigation.navigate('HabitReminderEdit', { habitId: habit.id })}
                style={({ pressed }) => [
                  s.row,
                  index < withReminder.length - 1 && [s.rowBorder, { borderBottomColor: colors.separator }],
                  pressed && { backgroundColor: colors.bgSecondary },
                ]}
              >
                <Text style={[s.habitName, { color: colors.text1 }]} numberOfLines={1}>{habit.name}</Text>
                <View style={s.rowRight}>
                  <Text style={[s.time, { color: colors.text2 }]}>{habit.reminderTime ? formatTime(habit.reminderTime) : ''}</Text>
                  <ChevronRight size={20} color={colors.chevron} strokeWidth={2.5} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 24 },
  empty: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 32,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  habitName: { fontSize: 17, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { fontSize: 17, fontWeight: '500' },
});
