import React, { useRef, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from './types';

import { useTheme } from '@/context/ThemeContext';
import { useSettingsStore } from '@/store/settingsStore';
import TabNavigator from './TabNavigator';
import WizardNavigator from './WizardNavigator';
import HabitDetailScreen from '@/screens/HabitDetailScreen';
import DeletedHabitsScreen from '@/screens/DeletedHabitsScreen';
import NotificationSettingsScreen from '@/screens/NotificationSettingsScreen';
import HabitRemindersScreen from '@/screens/HabitRemindersScreen';
import HabitReminderEditScreen from '@/screens/HabitReminderEditScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from '@/screens/TermsOfServiceScreen';
import OnboardingFlow from '@/screens/onboarding/OnboardingFlow';
import Onboarding4 from '@/screens/onboarding/Onboarding4';
import Onboarding5 from '@/screens/onboarding/Onboarding5';

function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Onboarding1'>>();
  return <OnboardingFlow onComplete={() => navigation.navigate('Onboarding4')} />;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const hasCompletedOnboarding = useSettingsStore(s => s.hasCompletedOnboarding);
  const stackRef = useRef<React.ComponentRef<typeof Stack.Navigator>>(null);

  // When persisted state rehydrates and user has already completed onboarding, go to Tabs
  useEffect(() => {
    if (hasCompletedOnboarding && stackRef.current) {
      stackRef.current.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });
    }
  }, [hasCompletedOnboarding]);

  return (
    <Stack.Navigator
      ref={stackRef}
      initialRouteName={hasCompletedOnboarding ? 'Tabs' : 'Onboarding1'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgSecondary },
      }}
    >
      {/* Main tabs — always the base of the stack */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* Habit detail — pushed over a tab */}
      <Stack.Screen
        name="HabitDetail"
        component={HabitDetailScreen}
        options={{
          headerShown: true,
          headerBackTitle: t('common.back'),
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: '',
        }}
      />

      {/* New habit wizard — presented as a modal card */}
      <Stack.Screen
        name="NewHabit"
        component={WizardNavigator}
        options={{ presentation: 'modal' }}
      />

      {/* Edit habit wizard — same wizard, presented as a modal card */}
      <Stack.Screen
        name="EditHabit"
        component={WizardNavigator}
        options={{ presentation: 'modal' }}
      />

      {/* Global notification / reminder settings */}
      <Stack.Screen
        name="Notifications"
        component={NotificationSettingsScreen}
        options={{
          headerShown: true,
          headerBackTitle: t('common.back'),
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: t('nav.notifications'),
        }}
      />

      {/* Per-habit reminder times */}
      <Stack.Screen
        name="HabitReminders"
        component={HabitRemindersScreen}
        options={{
          headerShown: true,
          headerBackTitle: t('common.back'),
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: t('nav.habitReminders'),
        }}
      />
      <Stack.Screen
        name="HabitReminderEdit"
        component={HabitReminderEditScreen}
        options={{
          headerShown: true,
          headerBackTitle: t('common.back'),
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: t('wizard.reminderTime'),
        }}
      />

      {/* Deleted habits list */}
      <Stack.Screen
        name="DeletedHabits"
        component={DeletedHabitsScreen}
        options={{
          headerShown: true,
          headerBackTitle: t('common.back'),
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: t('nav.deletedHabits'),
        }}
      />

      {/* Legal */}
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          headerShown: true,
          headerBackTitle: t('common.back'),
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: t('nav.privacyPolicy'),
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          headerShown: true,
          headerBackTitle: t('common.back'),
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: t('nav.termsOfService'),
        }}
      />

      <Stack.Screen name="Onboarding1" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Onboarding4" component={Onboarding4} options={{ headerShown: false }} />
      <Stack.Screen name="Onboarding5" component={Onboarding5} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
