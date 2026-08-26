import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryLabels, verdictStyles } from '../food-meta';
import { macrosForGrams } from '../macros';
import { colors, radius, spacing, typography } from '../theme';
import type { Food } from '../types';

interface FoodRowProps {
  food: Food;
  isExpanded: boolean;
  onToggle: () => void;
}

export function FoodRow({ food, isExpanded, onToggle }: FoodRowProps) {
  const verdict = verdictStyles[food.verdict];
  const [defaultPortion] = food.portions;
  const portionMacros = macrosForGrams(food.per100g, defaultPortion.grams);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: verdict.color }]} />

        <View style={styles.headerText}>
          <Text style={styles.name}>{food.name}</Text>
          <Text style={styles.meta}>
            {categoryLabels[food.category]} · {food.per100g.netCarbG} g / 100 g
          </Text>
        </View>

        <Ionicons
          color={colors.textMuted}
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
        />
      </View>

      {isExpanded ? (
        <View style={styles.detail}>
          <View style={[styles.badge, { backgroundColor: verdict.surface }]}>
            <Ionicons color={verdict.color} name={verdict.icon} size={14} />
            <Text style={[styles.badgeText, { color: verdict.color }]}>{verdict.label}</Text>
          </View>

          <View style={styles.portionRow}>
            <Ionicons color={colors.textMuted} name="resize-outline" size={16} />
            <Text style={styles.portionText}>
              {defaultPortion.label} ({defaultPortion.grams} g) ≈ {portionMacros.netCarbG} g net
              karb, {portionMacros.kcal} kcal
            </Text>
          </View>

          <Text style={styles.why}>{food.why}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { fontSize: typography.small, fontWeight: '800' },
  detail: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md },
  dot: { borderRadius: radius.pill, height: 10, marginTop: 5, width: 10 },
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  meta: { color: colors.textMuted, fontSize: typography.small },
  name: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  portionRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  portionText: { color: colors.text, flex: 1, fontSize: typography.small, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  row: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, padding: spacing.lg },
  why: { color: colors.textMuted, fontSize: typography.small, lineHeight: 20 },
});
