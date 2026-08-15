import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ProfileProvider, useProfile } from '../src/profile-context';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <ProfileProvider>
      <RootNavigator />
    </ProfileProvider>
  );
}

function RootNavigator() {
  const { isLoading, profile } = useProfile();
  const router = useRouter();
  const segments = useSegments();

  const isOnboarding = segments[0] === 'onboarding';

  useEffect(() => {
    if (!isLoading && !profile && !isOnboarding) {
      router.replace('/onboarding');
    }
  }, [isLoading, isOnboarding, profile, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="article/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
