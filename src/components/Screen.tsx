import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

/** Sekme çubuğu yüzdüğü için içeriğin altında bu kadar yer bırakmak gerekiyor. */
const TAB_BAR_CLEARANCE = 64 + spacing.md + spacing.lg;

interface ScreenProps {
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Sekme çubuğu olmayan ekranlarda (yığın ekranları) yalnızca sistem çubuğu
   * boşluğu eklenir; sekmeli ekranlarda yüzen çubuğun payı ayrılır.
   */
  withBottomInset?: boolean;
}

export function Screen({
  children,
  contentStyle,
  withBottomInset = false,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();

  const bottomPadding = withBottomInset
    ? insets.bottom + spacing.xxl
    : insets.bottom + TAB_BAR_CLEARANCE;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: bottomPadding },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingHorizontal: spacing.xl },
  screen: { backgroundColor: colors.background },
});
