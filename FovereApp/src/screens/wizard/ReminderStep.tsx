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
import { useWizardStore } from '@/store/wizardStore';
import { C } from '@/lib/tokens';

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
          <Text style={s.doneBtn}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <Text style={s.helper}>Choose when you want to be reminded.</Text>

      <View style={s.card}>
        {/* Hours column */}
        <TimeColumn
          value={h12}
          onInc={incH}
          onDec={decH}
        />

        <Text style={s.colon}>:</Text>

        {/* Minutes column */}
        <TimeColumn
          value={pad(m)}
          onInc={incM}
          onDec={decM}
        />

        {/* AM / PM column */}
        <View style={s.ampmCol}>
          <Pressable
            onPress={() => { if (h >= 12) setH(h - 12); }}
            style={[s.ampmBtn, h < 12 && s.ampmBtnActive]}
          >
            <Text style={[s.ampmText, h < 12 && s.ampmTextActive]}>AM</Text>
          </Pressable>
          <Pressable
            onPress={() => { if (h < 12) setH(h + 12); }}
            style={[s.ampmBtn, h >= 12 && s.ampmBtnActive]}
          >
            <Text style={[s.ampmText, h >= 12 && s.ampmTextActive]}>PM</Text>
          </Pressable>
        </View>
      </View>

      <Text style={s.preview}>
        Reminder at {h12}:{pad(m)} {ampm}
      </Text>
    </SafeAreaView>
  );
}

function TimeColumn({ value, onInc, onDec }: { value: string; onInc: () => void; onDec: () => void }) {
  return (
    <View style={s.col}>
      <Pressable onPress={onInc} style={s.arrowBtn} hitSlop={8}>
        <ChevronUp size={28} color={C.teal} strokeWidth={2.5} />
      </Pressable>
      <Text style={s.timeNum}>{value}</Text>
      <Pressable onPress={onDec} style={s.arrowBtn} hitSlop={8}>
        <ChevronDown size={28} color={C.teal} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F2F2F7' },
  doneBtn: { fontSize: 17, fontWeight: '600', color: C.teal },

  helper: {
    fontSize: 15,
    color: C.text2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
    letterSpacing: -1,
    lineHeight: 60,
    textAlign: 'center',
  },
  colon: {
    fontSize: 44,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    alignSelf: 'center',
  },

  ampmCol: { marginLeft: 12, gap: 8 },
  ampmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  ampmBtnActive: { backgroundColor: C.teal },
  ampmText:      { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  ampmTextActive:{ color: '#FFFFFF' },

  preview: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 15,
    color: C.text2,
  },
});
