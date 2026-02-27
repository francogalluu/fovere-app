import React from 'react';
import {
  View, Text, Switch, Pressable, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import { useSettingsStore } from '@/store/settingsStore';

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const {
    hapticFeedback,     setHapticFeedback,
    notificationsEnabled, setNotificationsEnabled,
    weekStartsOn,       setWeekStartsOn,
  } = useSettingsStore();

  const handleNotificationsToggle = (value: boolean) => {
    // Notifications permission wiring lives in M10; for now just persist the preference.
    setNotificationsEnabled(value);
  };

  const handleWeekStartPress = () => {
    Alert.alert(
      'Week Starts On',
      undefined,
      [
        { text: 'Sunday',  onPress: () => setWeekStartsOn(0), style: weekStartsOn === 0 ? 'destructive' : 'default' },
        { text: 'Monday',  onPress: () => setWeekStartsOn(1), style: weekStartsOn === 1 ? 'destructive' : 'default' },
        { text: 'Cancel',  style: 'cancel' },
      ],
    );
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, 'Coming soon!', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Text style={s.title}>Settings</Text>

        {/* ── Preferences ─────────────────────────────────────────────── */}
        <Section title="Preferences">
          <SettingRow
            label="Notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#E5E5EA', true: '#008080' }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            label="Haptic Feedback"
            right={
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: '#E5E5EA', true: '#008080' }}
                thumbColor="#fff"
              />
            }
          />
          <SettingRow
            label="Week Starts On"
            value={weekStartsOn === 0 ? 'Sunday' : 'Monday'}
            onPress={handleWeekStartPress}
            showChevron
            last
          />
        </Section>

        {/* ── Data ────────────────────────────────────────────────────── */}
        <Section title="Data">
          <SettingRow
            label="Export Data"
            onPress={() => handleComingSoon('Export Data')}
            showChevron
          />
          <SettingRow
            label="Backup"
            onPress={() => handleComingSoon('Backup')}
            showChevron
          />
          <SettingRow
            label="Deleted Habits"
            onPress={() => navigation.navigate('DeletedHabits')}
            showChevron
            last
          />
        </Section>

        {/* ── About ───────────────────────────────────────────────────── */}
        <Section title="About">
          <SettingRow label="Version" value="1.0.0" />
          <SettingRow
            label="Privacy Policy"
            onPress={() => handleComingSoon('Privacy Policy')}
            showChevron
          />
          <SettingRow
            label="Terms of Service"
            onPress={() => handleComingSoon('Terms of Service')}
            showChevron
            last
          />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({
  label,
  value,
  right,
  onPress,
  showChevron = false,
  last = false,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        s.row,
        !last && s.rowBorder,
        pressed && onPress && { backgroundColor: '#F2F2F7' },
      ]}
    >
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.rowRight}>
        {value ? <Text style={s.rowValue}>{value}</Text> : null}
        {right ?? null}
        {showChevron && !right ? (
          <ChevronRight size={20} color="#C7C7CC" strokeWidth={2.5} />
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { paddingBottom: 20 },

  title: {
    fontSize: 34, fontWeight: '700', color: '#1A1A1A',
    letterSpacing: -0.68, paddingHorizontal: 24,
    paddingTop: 16, paddingBottom: 24,
  },

  section:      { marginBottom: 32 },
  sectionTitle: {
    fontSize: 13, color: '#6D6D72', textTransform: 'uppercase',
    letterSpacing: 0.4, paddingHorizontal: 16, marginBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff',
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  rowLabel: { fontSize: 17, color: '#1A1A1A' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 17, color: '#999' },
});
