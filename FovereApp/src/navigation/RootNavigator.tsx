import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import { useTheme } from '@/context/ThemeContext';
import TabNavigator from './TabNavigator';
import WizardNavigator from './WizardNavigator';
import HabitDetailScreen from '@/screens/HabitDetailScreen';
import DeletedHabitsScreen from '@/screens/DeletedHabitsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
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
          headerBackTitle: 'Back',
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

      {/* Deleted habits list */}
      <Stack.Screen
        name="DeletedHabits"
        component={DeletedHabitsScreen}
        options={{
          headerShown: true,
          headerBackTitle: 'Back',
          headerTintColor: colors.teal,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerShadowVisible: false,
          headerTitle: 'Deleted Habits',
        }}
      />
    </Stack.Navigator>
  );
}
