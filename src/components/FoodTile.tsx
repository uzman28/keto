import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { verdictStyles } from '../food-meta';
import { colors, fonts, radius, spacing, typography } from '../theme';
import type { Food } from '../types';

interface FoodTileProps {
  /** Ana sayfa destesinin ilk kartını öne çıkarmak için. */
  eyebrow?: string;
  food: Food;
  onPress: () => void;
}

export function FoodTile({ eyebrow, food, onPress }: FoodTileProps) {
  const verdict = verdictStyles[food.verdict];

  return (
    <Pressable
      accessibilityHint="Ayrıntıları görmek için besin listesini açar"
      accessibilityLabel={`${food.name}, ${verdict.label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

      <View style={[styles.badge, { backgroundColor: verdict.surface }]}>
        <Ionicons color={verdict.color} name={verdict.icon} size={14} />
        <Text style={[styles.badgeText, { color: verdict.color }]}>{verdict.shortLabel}</Text>
      </View>

      <Text numberOfLines={2} style={styles.name}>
        {food.name}
      </Text>

      <View style={styles.carbRow}>
        <Text style={styles.carbValue}>{food.per100g.netCarbG}</Text>
        <Text style={styles.carbUnit}>g</Text>
      </View>
      <Text style={styles.carbLabel}>100 g'da net karb</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { fontSize: typography.small, fontFamily: fonts.black },
  carbLabel: { color: colors.textMuted, fontSize: typography.small },
  carbRow: { alignItems: 'baseline', flexDirection: 'row', gap: 2, marginTop: 'auto' },
  carbUnit: { color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.bold },
  carbValue: { color: colors.text, fontSize: typography.section, fontFamily: fonts.black },
  eyebrow: { color: colors.accent, fontSize: typography.small, fontFamily: fonts.black, letterSpacing: 0.8 },
  name: { color: colors.text, fontSize: typography.body, fontFamily: fonts.bold, lineHeight: 21 },
  pressed: { opacity: 0.85 },
  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 150,
    padding: spacing.md,
    width: 150,
  },
});
