import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { WizardStackParamList } from './types';

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
  return (
    <Stack.Navigator
      initialRouteName="HabitSource"
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: '#008080',
        headerStyle: { backgroundColor: '#F2F2F7' },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600', color: '#1A1A1A' },
        contentStyle: { backgroundColor: '#F2F2F7' },
      }}
    >
      <Stack.Screen
        name="HabitSource"
        component={HabitSourceStep}
        options={{ title: 'Add a new habit' }}
      />
      <Stack.Screen
        name="HabitType"
        component={HabitTypeStep}
        options={{ title: 'New Habit' }}
      />
      <Stack.Screen
        name="HabitName"
        component={HabitNameStep}
        options={{ title: 'Name' }}
      />
      <Stack.Screen
        name="HabitIcon"
        component={HabitIconStep}
        options={{ title: 'Icon' }}
      />
      <Stack.Screen
        name="Description"
        component={DescriptionStep}
        options={{ title: 'Description' }}
      />
      <Stack.Screen
        name="Frequency"
        component={FrequencyStep}
        options={{ title: 'Frequency' }}
      />
      <Stack.Screen
        name="MeasureBy"
        component={MeasureByStep}
        options={{ title: 'Measure by' }}
      />
      <Stack.Screen
        name="Target"
        component={TargetStep}
        options={{ title: 'Target' }}
      />
      <Stack.Screen
        name="Reminder"
        component={ReminderStep}
        options={{ title: 'Reminder' }}
      />
    </Stack.Navigator>
  );
}
