import '@/src/utils/silenceKnownWarnings'; // tekan warning pointerEvents dari react-navigation (library)
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import SplashScreen from '@/components/splash-screen';
import { AppToast } from '@/components/ui/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { initI18n } from '@/src/i18n';
import { requestNotificationPermission } from '@/src/utils/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
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
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  const finishSplash = useCallback(() => setSplashDone(true), []);

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
      {/* Halaman awal: overlay di atas stack, hilang otomatis 2 detik / saat di-tap */}
      {!splashDone && <SplashScreen onFinish={finishSplash} />}
      {/* Notifikasi in-app (toast) — di-render paling atas agar selalu terlihat */}
      <AppToast />
    </AuthProvider>
  );
}
