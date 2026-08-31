import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, tracking, typography } from '../theme';

interface AppHeaderProps {
  /** Sağ taraftaki yuvarlak alan; tasarımda profil fotoğrafı duruyor. */
  right?: ReactNode;
  title: string;
}

/**
 * Her ekranın tepesindeki çubuk: logo karesi + BÜYÜK HARF ekran adı + sağda
 * yuvarlak alan. Tasarımda sabit ve bulanık; RN'de bulanıklık maliyetli olduğu
 * için akışın içinde, zeminle aynı renkte duruyor.
 */
export function AppHeader({ right, title }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Ionicons color={colors.accent} name="flash" size={15} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>

      {right ?? <View style={styles.avatar} />}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderColor: colors.accentSurface,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 38,
    width: 38,
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.accentSurface,
    borderRadius: radius.sm,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: typography.section,
    letterSpacing: tracking.tight,
    textTransform: 'uppercase',
  },
});
