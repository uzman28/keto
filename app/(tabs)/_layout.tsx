import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { colors, spacing, typography } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: typography.small, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: spacing.sm,
          paddingTop: spacing.sm,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="home-outline" size={22} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Tarifler',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="restaurant-outline" size={22} />,
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: 'Rehber',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="book-outline" size={22} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <Ionicons color={color} name="settings-outline" size={22} />,
        }}
      />
    </Tabs>
  );
}
