import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, BarChart3, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TabParamList } from './types';

import { useTheme } from '@/context/ThemeContext';
import HomeScreen from '@/screens/HomeScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import AnalyticsScreen from '@/screens/AnalyticsScreen';
import SettingsScreen from '@/screens/SettingsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.text4,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.separator,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: t('tabs.calendar'),
          tabBarIcon: ({ color, size }) => (
            <Calendar color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: t('tabs.analytics'),
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} strokeWidth={2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
