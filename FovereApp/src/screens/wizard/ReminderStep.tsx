/**
 * ReminderStep — set the reminder time (HH:MM).
 * Uses +/− steppers for hours and minutes; no native date-picker dependency.
 */
import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WizardStackParamList } from '@/navigation/types';
import { useTheme } from '@/context/ThemeContext';
import { useWizardStore } from '@/store/wizardStore';

type Props = NativeStackScreenProps<WizardStackParamList, 'Reminder'>;

function pad(n: number) { return String(n).padStart(2, '0'); }

function parseTime(hhmm: string): { h: number; m: number } {
  const [hStr, mStr] = hhmm.split(':');
  return { h: parseInt(hStr, 10), m: parseInt(mStr, 10) };
}

function formatDisplay(h: number): { h12: string; ampm: string } {
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { h12: String(h12), ampm };
}

export default function ReminderStep({ navigation }: Props) {
  const { colors } = useTheme();
  const reminderTime    = useWizardStore(s => s.reminderTime);
  const setReminderTime = useWizardStore(s => s.setReminderTime);

  const { h, m } = parseTime(reminderTime);
  const { h12, ampm } = formatDisplay(h);

  const setH = (newH: number) => setReminderTime(`${pad(newH)}:${pad(m)}`);
  const setM = (newM: number) => setReminderTime(`${pad(h)}:${pad(newM)}`);

  const incH = () => setH((h + 1) % 24);
  const decH = () => setH((h + 23) % 24);
  const incM = () => setM((m + 5) % 60);
  const decM = () => setM(Math.floor(m / 5) * 5 === m ? (m + 55) % 60 : Math.floor(m / 5) * 5);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Reminder Time',
      headerRight: () => (
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={[s.doneBtn, { color: colors.teal }]}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation, colors.teal]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['bottom']}>
      <Text style={[s.helper, { color: colors.text2 }]}>Choose when you want to be reminded.</Text>

      <View style={[s.card, { backgroundColor: colors.bgCard }]}>
        <TimeColumn value={h12} onInc={incH} onDec={decH} />
        <Text style={[s.colon, { color: colors.text1 }]}>:</Text>
        <TimeColumn value={pad(m)} onInc={incM} onDec={decM} />
        <View style={s.ampmCol}>
          <Pressable
            onPress={() => { if (h >= 12) setH(h - 12); }}
            style={[s.ampmBtn, { backgroundColor: colors.bgSecondary }, h < 12 && [s.ampmBtnActive, { backgroundColor: colors.teal }]]}
          >
            <Text style={[s.ampmText, { color: colors.text2 }, h < 12 && { color: colors.white }]}>AM</Text>
          </Pressable>
          <Pressable
            onPress={() => { if (h < 12) setH(h + 12); }}
            style={[s.ampmBtn, { backgroundColor: colors.bgSecondary }, h >= 12 && [s.ampmBtnActive, { backgroundColor: colors.teal }]]}
          >
            <Text style={[s.ampmText, { color: colors.text2 }, h >= 12 && { color: colors.white }]}>PM</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[s.preview, { color: colors.text2 }]}>
        Reminder at {h12}:{pad(m)} {ampm}
      </Text>
    </SafeAreaView>
  );
}

function TimeColumn({ value, onInc, onDec }: { value: string; onInc: () => void; onDec: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={s.col}>
      <Pressable onPress={onInc} style={s.arrowBtn} hitSlop={8}>
        <ChevronUp size={28} color={colors.teal} strokeWidth={2.5} />
      </Pressable>
      <Text style={[s.timeNum, { color: colors.text1 }]}>{value}</Text>
      <Pressable onPress={onDec} style={s.arrowBtn} hitSlop={8}>
        <ChevronDown size={28} color={colors.teal} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  doneBtn: { fontSize: 17, fontWeight: '600' },

  helper: {
    fontSize: 15,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  col: { alignItems: 'center', width: 64 },
  arrowBtn: { padding: 4 },
  timeNum: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 60,
    textAlign: 'center',
  },
  colon: {
    fontSize: 44,
    fontWeight: '700',
    marginBottom: 8,
    alignSelf: 'center',
  },

  ampmCol: { marginLeft: 12, gap: 8 },
  ampmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ampmBtnActive: {},
  ampmText:      { fontSize: 15, fontWeight: '600' },
  ampmTextActive: {},

  preview: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
  },
});
