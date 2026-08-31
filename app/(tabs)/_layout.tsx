import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../src/theme';

const TAB_HEIGHT = 64;

/**
 * Yüzen hap biçimli sekme çubuğu: ekranın alt kenarına yapışmak yerine
 * içerikten ayrılıp havada duruyor. Seçili sekme mor daire içinde.
 * Etiketler kaldırıldı — ikon ve renk yeterli, daha sakin bir alt bar oluyor.
 */
export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarShowLabel: false,
        tabBarItemStyle: { height: TAB_HEIGHT },
        tabBarStyle: {
          backgroundColor: colors.surfaceHigh,
          borderRadius: radius.pill,
          borderTopWidth: 0,
          bottom: insets.bottom + spacing.md,
          elevation: 0,
          height: TAB_HEIGHT,
          left: spacing.xl,
          position: 'absolute',
          right: spacing.xl,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="grid" />,
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Öğünler',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="restaurant" />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'İlerleme',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="stats-chart" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="person" />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  focused,
  name,
}: {
  focused: boolean;
  name: 'grid' | 'restaurant' | 'stats-chart' | 'person';
}) {
  return (
    <View style={[styles.icon, focused && styles.iconActive]}>
      <Ionicons
        color={focused ? colors.background : colors.textMuted}
        name={focused ? name : (`${name}-outline` as const)}
        size={22}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  iconActive: { backgroundColor: colors.accent },
});
