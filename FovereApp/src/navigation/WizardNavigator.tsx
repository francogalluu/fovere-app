import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { WizardStackParamList } from './types';

import { useTheme } from '@/context/ThemeContext';
import HabitSourceStep from '@/screens/wizard/HabitSourceStep';
import HabitTypeStep from '@/screens/wizard/HabitTypeStep';
import HabitNameStep from '@/screens/wizard/HabitNameStep';
import HabitIconStep from '@/screens/wizard/HabitIconStep';
import DescriptionStep from '@/screens/wizard/DescriptionStep';
import FrequencyStep from '@/screens/wizard/FrequencyStep';
import MeasureByStep from '@/screens/wizard/MeasureByStep';
import TargetStep from '@/screens/wizard/TargetStep';
import ReminderStep from '@/screens/wizard/ReminderStep';

const Stack = createNativeStackNavigator<WizardStackParamList>();

export default function WizardNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      initialRouteName="HabitSource"
      screenOptions={{
        headerShown: true,
        headerBackTitle: t('common.back'),
        headerTintColor: colors.teal,
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600', color: colors.text1 },
        contentStyle: { backgroundColor: colors.bgSecondary },
      }}
    >
      <Stack.Screen
        name="HabitSource"
        component={HabitSourceStep}
        options={{ title: t('wizard.addNewHabit') }}
      />
      <Stack.Screen
        name="HabitType"
        component={HabitTypeStep}
        options={{ title: t('wizard.newHabit') }}
      />
      <Stack.Screen
        name="HabitName"
        component={HabitNameStep}
        options={{ title: t('wizard.name') }}
      />
      <Stack.Screen
        name="HabitIcon"
        component={HabitIconStep}
        options={{ title: t('wizard.icon') }}
      />
      <Stack.Screen
        name="Description"
        component={DescriptionStep}
        options={{ title: t('wizard.description') }}
      />
      <Stack.Screen
        name="Frequency"
        component={FrequencyStep}
        options={{ title: t('wizard.frequency') }}
      />
      <Stack.Screen
        name="MeasureBy"
        component={MeasureByStep}
        options={{ title: t('wizard.measureBy') }}
      />
      <Stack.Screen
        name="Target"
        component={TargetStep}
        options={{ title: t('wizard.target') }}
      />
      <Stack.Screen
        name="Reminder"
        component={ReminderStep}
        options={{ title: t('wizard.reminder') }}
      />
    </Stack.Navigator>
  );
}
