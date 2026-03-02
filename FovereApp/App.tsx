import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { i18n, getDeviceLocale } from './src/i18n';
import { useSettingsStore } from './src/store/settingsStore';

// Ensure i18n is initialized (side-effect import).
void i18n;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Syncs persisted language (or device locale on first launch) with i18n. */
function LanguageSync({ children }: { children: React.ReactNode }) {
  const language = useSettingsStore(s => s.language);
  const setLanguage = useSettingsStore(s => s.setLanguage);

  useEffect(() => {
    let lang = language;
    if (lang === undefined) {
      lang = getDeviceLocale();
      setLanguage(lang);
    }
    i18n.changeLanguage(lang);
  }, [language, setLanguage]);

  return <>{children}</>;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageSync>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </LanguageSync>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
