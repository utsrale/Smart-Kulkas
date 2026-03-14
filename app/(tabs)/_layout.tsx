import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2ecc71',
          tabBarInactiveTintColor: '#a4b0be',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: -3 },
            shadowRadius: 10,
            backgroundColor: '#fff',
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            paddingTop: 10,
          }
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Fridge',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="refrigerator" color={color} />,
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Recipes',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
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
  },
});
