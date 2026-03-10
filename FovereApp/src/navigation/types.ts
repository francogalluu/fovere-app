import type { NavigatorScreenParams } from '@react-navigation/native';

export type OnboardingCategory =
  | 'health-fitness'
  | 'mind-mood'
  | 'career-study'
  | 'home-organization'
  | 'finances'
  | 'relationships'
  | 'creativity-hobbies';

// ─── Wizard stack ─────────────────────────────────────────────────────────────
export type WizardStackParamList = {
  HabitSource: { goalType?: 'build' | 'break'; onboardingCategory?: OnboardingCategory };
  HabitType: undefined;
  HabitName: undefined;
  HabitIcon: undefined;
  Description: undefined;
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
  Notifications: undefined;
  HabitReminders: undefined;
  HabitReminderEdit: { habitId: string };
  DeletedHabits: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  HabitsScoring: undefined;
  Onboarding1: undefined;
  Onboarding4: undefined;
  Onboarding5: undefined;
};

// ─── Bottom tab navigator ─────────────────────────────────────────────────────
export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Analytics: undefined;
  Settings: undefined;
};
