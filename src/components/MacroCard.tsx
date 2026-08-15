import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

interface MacroCardProps {
  calories: number;
  grams: number;
  highlighted?: boolean;
  title: string;
}

export function MacroCard({ calories, grams, highlighted = false, title }: MacroCardProps) {
  return (
    <View style={[styles.card, highlighted && styles.highlightedCard]}>
      <Text style={[styles.title, highlighted && styles.highlightedText]}>{title}</Text>
      <Text style={[styles.grams, highlighted && styles.highlightedText]}>{grams} g</Text>
      <Text style={[styles.calories, highlighted && styles.highlightedText]}>{calories} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  calories: { color: colors.textMuted, fontSize: typography.small },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 108,
    padding: spacing.md,
  },
  grams: { color: colors.text, fontSize: typography.section, fontWeight: '700' },
  highlightedCard: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  highlightedText: { color: colors.accent },
  title: { color: colors.textMuted, fontSize: typography.small, fontWeight: '600', lineHeight: 18 },
});
