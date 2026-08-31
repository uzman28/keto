import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '../theme';

/** Yaygın "günde 8 bardak" pratiği; kişiye göre değişir, bu yüzden hedef değil rehber. */
export const WATER_TARGET_GLASSES = 8;

interface WaterCardProps {
  glasses: number;
  onChange: (delta: number) => void;
}

export function WaterCard({ glasses, onChange }: WaterCardProps) {
  const isTargetReached = glasses >= WATER_TARGET_GLASSES;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Su</Text>
          <Text style={styles.subtitle}>
            {glasses} / {WATER_TARGET_GLASSES} bardak
            {isTargetReached ? ' · hedefe ulaştın' : ''}
          </Text>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityLabel="Bir bardak azalt"
            accessibilityRole="button"
            disabled={glasses === 0}
            hitSlop={spacing.sm}
            onPress={() => onChange(-1)}
            style={({ pressed }) => [
              styles.controlButton,
              glasses === 0 && styles.controlDisabled,
              pressed && styles.pressed,
            ]}>
            <Ionicons color={colors.text} name="remove" size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Bir bardak ekle"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={() => onChange(1)}
            style={({ pressed }) => [styles.controlButton, styles.controlAdd, pressed && styles.pressed]}>
            <Ionicons color={colors.background} name="add" size={20} />
          </Pressable>
        </View>
      </View>

      <View style={styles.glassRow}>
        {Array.from({ length: WATER_TARGET_GLASSES }, (_, index) => (
          <Ionicons
            color={index < glasses ? colors.accent : colors.border}
            key={index}
            name={index < glasses ? 'water' : 'water-outline'}
            size={20}
          />
        ))}
        {glasses > WATER_TARGET_GLASSES ? (
          <Text style={styles.extra}>+{glasses - WATER_TARGET_GLASSES}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  controlAdd: { backgroundColor: colors.accent, borderColor: colors.accent },
  controlButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  controlDisabled: { opacity: 0.4 },
  controls: { flexDirection: 'row', gap: spacing.sm },
  extra: { color: colors.accent, fontSize: typography.small, fontFamily: fonts.bold },
  glassRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  headerText: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.7 },
  subtitle: { color: colors.textMuted, fontSize: typography.small },
  title: { color: colors.text, fontSize: typography.body, fontFamily: fonts.bold },
});
