import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/context/ThemeContext';
import { useHabitStore } from '@/store';

type Route = RouteProp<RootStackParamList, 'HabitReminderEdit'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'HabitReminderEdit'>;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseTime(hhmm: string): { h: number; m: number } {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  return {
    h: Number.isNaN(h) ? 8 : h,
    m: Number.isNaN(m) ? 0 : m,
  };
}

export default function HabitReminderEditScreen() {
  const { habitId } = useRoute<Route>().params;
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const habits = useHabitStore(s => s.habits);
  const updateHabit = useHabitStore(s => s.updateHabit);

  const habit = habits.find(h => h.id === habitId);
  const reminderTime = habit?.reminderTime ?? '08:00';

  const { h, m } = useMemo(() => parseTime(reminderTime), [reminderTime]);
  const formattedTime = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
  const timeValue = useMemo(() => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }, [h, m]);

  const setTime = (next: string) => {
    updateHabit(habitId, { reminderTime: next });
  };

  const handleRemoveReminder = () => {
    updateHabit(habitId, { reminderTime: undefined });
    navigation.goBack();
  };

  const handleTimePickerChange = (_event: unknown, date?: Date) => {
    if (!date) return;
    const nextH = date.getHours();
    const nextM = date.getMinutes();
    setTime(`${pad(nextH)}:${pad(nextM)}`);
  };

  const changeTimeByMinutes = (deltaMinutes: number) => {
    const total = (h * 60 + m + deltaMinutes + 24 * 60) % (24 * 60);
    const nextH = Math.floor(total / 60);
    const nextM = total % 60;
    setTime(`${pad(nextH)}:${pad(nextM)}`);
  };

  if (!habit) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
        <Text style={[s.error, { color: colors.text2 }]}>{t('habitDetail.notFound')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <View style={s.content}>
        <Text style={[s.title, { color: colors.text1 }]}>{habit.name}</Text>
        <Text style={[s.subtitle, { color: colors.text2 }]}>{t('notifications.remindMeAt')}</Text>

        <View style={[s.card, { backgroundColor: colors.bgCard }]}>
          {Platform.OS === 'ios' ? (
            <View style={s.iosTimeSection}>
              <Text style={[s.timeValue, { color: colors.text2 }]}>{formattedTime}</Text>
              <View style={s.iosPickerWrap}>
                <DateTimePicker
                  value={timeValue}
                  mode="time"
                  onChange={handleTimePickerChange}
                  display="spinner"
                  minuteInterval={5}
                  themeVariant={isDark ? 'dark' : 'light'}
                  style={s.iosPicker}
                />
              </View>
            </View>
          ) : (
            <View style={[s.row, { borderBottomColor: colors.separator }]}>
              <Text style={[s.timeValue, { color: colors.teal }]}>{formattedTime}</Text>
              <View style={s.timeControls}>
                <Pressable onPress={() => changeTimeByMinutes(-15)} hitSlop={8}>
                  <Text style={[s.stepper, { color: colors.teal }]}>−</Text>
                </Pressable>
                <Pressable onPress={() => changeTimeByMinutes(15)} hitSlop={8}>
                  <Text style={[s.stepper, { color: colors.teal }]}>+</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleRemoveReminder}
          style={({ pressed }) => [s.removeBtn, { borderColor: colors.danger }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[s.removeBtnText, { color: colors.danger }]}>{t('habitReminders.removeReminder')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 15, marginBottom: 24 },
  error: { fontSize: 16, textAlign: 'center', padding: 24 },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeValue: { fontSize: 16, fontWeight: '600' },
  timeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { fontSize: 20, fontWeight: '600', paddingHorizontal: 4 },
  iosTimeSection: { paddingHorizontal: 16, paddingVertical: 12 },
  iosPickerWrap: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  iosPicker: { width: '100%', height: 180 },
  removeBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  removeBtnText: { fontSize: 16, fontWeight: '600' },
});
