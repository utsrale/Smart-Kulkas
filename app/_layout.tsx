import '@/src/utils/silenceKnownWarnings'; // tekan warning pointerEvents dari react-navigation (library)
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { initI18n } from '@/src/i18n';
import { requestNotificationPermission } from '@/src/utils/notifications';

export const unstable_settings = {
  anchor: 'splash',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Tidak ada login lagi — app berjalan lokal penuh.
    // Minta izin notifikasi hanya untuk reminder kadaluwarsa (native).
    requestNotificationPermission();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="recipe-detail" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f8f7' }}>
        <ActivityIndicator size="large" color="#13ec6d" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
