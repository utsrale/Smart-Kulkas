import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  const { t } = useTranslation();

  const tabBarHeight = Platform.OS === 'ios' ? 85 : Platform.OS === 'web' ? 82 : 65;
  const tabBarPaddingBottom = Platform.OS === 'ios' ? 25 : Platform.OS === 'web' ? 16 : 10;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2ecc71',
          tabBarInactiveTintColor: '#a4b0be',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarLabelStyle: {
            fontSize: 12,
            lineHeight: 18,
            fontWeight: '600',
          },
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 10,
            boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.05)',
            backgroundColor: '#fff',
            height: tabBarHeight,
            paddingBottom: tabBarPaddingBottom,
            paddingTop: 10,
            ...(Platform.OS === 'web' ? { position: 'fixed' as any, bottom: 0, left: 0, right: 0, zIndex: 999 } : {}),
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.fridge'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="refrigerator" color={color} />,
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: t('tabs.recipes'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: t('tabs.shop'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: t('tabs.analytics'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? { height: '100vh' as any, overflow: 'hidden' as any } : {}),
  },
});
