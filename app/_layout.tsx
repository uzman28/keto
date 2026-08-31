import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_700Bold,
  Geist_900Black,
  useFonts,
} from '@expo-google-fonts/geist';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DayProvider } from '../src/day-context';
import { ProfileProvider, useProfile } from '../src/profile-context';
import { colors } from '../src/theme';

// Fontlar yüklenene kadar açılış ekranı kalsın; aksi halde ilk kare sistem
// fontuyla çizilip Geist'e atlıyor ve göze çarpan bir sıçrama oluyor.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_700Bold,
    Geist_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  // Font hatasında da devam ediyoruz — sistem fontuyla açılmak, hiç açılmamaktan iyi.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <DayProvider>
          <RootNavigator />
        </DayProvider>
      </ProfileProvider>
    </SafeAreaProvider>
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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="article/[id]" />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="foods" />
        <Stack.Screen name="add-entry" />
        <Stack.Screen name="weight" />
        <Stack.Screen name="recipes" />
        <Stack.Screen name="guide" />
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
