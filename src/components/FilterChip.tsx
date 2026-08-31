import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '../theme';

interface FilterChipProps {
  label: string;
  onPress: () => void;
  selected: boolean;
}

export function FilterChip({ label, onPress, selected }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  label: { color: colors.textMuted, fontSize: typography.small, fontFamily: fonts.medium },
  labelSelected: { color: colors.background },
  pressed: { opacity: 0.8 },
});
