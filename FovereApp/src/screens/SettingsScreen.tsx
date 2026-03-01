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
import { useTheme } from '@/context/ThemeContext';
import type { Palette } from '@/lib/theme';

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors } = useTheme();

  const {
    hapticFeedback,     setHapticFeedback,
    notificationsEnabled, setNotificationsEnabled,
    weekStartsOn,       setWeekStartsOn,
    darkMode,           setDarkMode,
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
        { text: 'Sunday',  onPress: () => setWeekStartsOn(0), style: 'default' },
        { text: 'Monday',  onPress: () => setWeekStartsOn(1), style: 'default' },
        { text: 'Cancel',  style: 'cancel' },
      ],
    );
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, 'Coming soon!', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bgSecondary }]} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Text style={[s.title, { color: colors.text1 }]}>Settings</Text>

        {/* ── Preferences ─────────────────────────────────────────────── */}
        <Section title="Preferences" colors={colors}>
          <SettingRow
            label="Dark mode"
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.separatorLight, true: colors.teal }}
                thumbColor={colors.white}
              />
            }
            colors={colors}
          />
          <SettingRow
            label="Notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: colors.separatorLight, true: colors.teal }}
                thumbColor={colors.white}
              />
            }
            colors={colors}
          />
          <SettingRow
            label="Haptic Feedback"
            right={
              <Switch
                value={hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: colors.separatorLight, true: colors.teal }}
                thumbColor={colors.white}
              />
            }
            colors={colors}
          />
          <SettingRow
            label="Week Starts On"
            value={weekStartsOn === 0 ? 'Sunday' : 'Monday'}
            onPress={handleWeekStartPress}
            showChevron
            last
            colors={colors}
          />
        </Section>

        {/* ── Data ────────────────────────────────────────────────────── */}
        <Section title="Data" colors={colors}>
          <SettingRow
            label="Export Data"
            onPress={() => handleComingSoon('Export Data')}
            showChevron
            colors={colors}
          />
          <SettingRow
            label="Backup"
            onPress={() => handleComingSoon('Backup')}
            showChevron
            colors={colors}
          />
          <SettingRow
            label="Deleted Habits"
            onPress={() => navigation.navigate('DeletedHabits')}
            showChevron
            last
            colors={colors}
          />
        </Section>

        {/* ── About ───────────────────────────────────────────────────── */}
        <Section title="About" colors={colors}>
          <SettingRow label="Version" value="1.0.0" colors={colors} />
          <SettingRow
            label="Privacy Policy"
            onPress={() => handleComingSoon('Privacy Policy')}
            showChevron
            colors={colors}
          />
          <SettingRow
            label="Terms of Service"
            onPress={() => handleComingSoon('Terms of Service')}
            showChevron
            last
            colors={colors}
          />
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: Palette }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.text2 }]}>{title}</Text>
      <View style={[s.sectionCard, { backgroundColor: colors.bgCard }]}>{children}</View>
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
  colors,
}: {
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  last?: boolean;
  colors: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        s.row,
        { backgroundColor: colors.bgCard },
        !last && [s.rowBorder, { borderBottomColor: colors.separator }],
        pressed && onPress && { backgroundColor: colors.bgSecondary },
      ]}
    >
      <Text style={[s.rowLabel, { color: colors.text1 }]}>{label}</Text>
      <View style={s.rowRight}>
        {value ? <Text style={[s.rowValue, { color: colors.text4 }]}>{value}</Text> : null}
        {right ?? null}
        {showChevron && !right ? (
          <ChevronRight size={20} color={colors.chevron} strokeWidth={2.5} />
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingBottom: 20 },

  title: {
    fontSize: 34, fontWeight: '700',
    letterSpacing: -0.68, paddingHorizontal: 24,
    paddingTop: 16, paddingBottom: 24,
  },

  section:      { marginBottom: 32 },
  sectionTitle: {
    fontSize: 13, textTransform: 'uppercase',
    letterSpacing: 0.4, paddingHorizontal: 16, marginBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 16, overflow: 'hidden',
  },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 17 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 17 },
});
