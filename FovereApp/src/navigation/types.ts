import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Wizard stack ─────────────────────────────────────────────────────────────
export type WizardStackParamList = {
  HabitType: undefined;
  HabitName: undefined;
  HabitIcon: undefined;
  Frequency: undefined;
  MeasureBy: undefined;
  Target: undefined;
  Reminder: undefined;
};

// ─── Root stack (sits above tabs, used for push/modal screens) ────────────────
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  HabitDetail: { id: string; date?: string };
  NewHabit: NavigatorScreenParams<WizardStackParamList>;
  EditHabit: { id: string } & NavigatorScreenParams<WizardStackParamList>;
};

// ─── Bottom tab navigator ─────────────────────────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Analytics: undefined;
  Settings: undefined;
};
