import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

interface ScreenProps {
  contentStyle?: StyleProp<ViewStyle>;
  /** Sekme çubuğu olmayan ekranlarda alttaki sistem çubuğu boşluğunu da ekler. */
  withBottomInset?: boolean;
}

export function Screen({
  children,
  contentStyle,
  withBottomInset = false,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: spacing.xxl + (withBottomInset ? insets.bottom : 0),
        },
        contentStyle,
      ]}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingHorizontal: spacing.xl },
  screen: { backgroundColor: colors.background },
});
