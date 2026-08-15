import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

interface SelectableOptionProps {
  description?: string;
  onPress: () => void;
  selected: boolean;
  title: string;
}

export function SelectableOption({
  description,
  onPress,
  selected,
  title,
}: SelectableOptionProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.indicator, selected && styles.indicatorSelected]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1, gap: spacing.xs },
  description: { color: colors.textMuted, fontSize: typography.small, lineHeight: 18 },
  indicator: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 18,
    marginLeft: spacing.md,
    width: 18,
  },
  indicatorSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  option: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.lg,
  },
  optionPressed: { opacity: 0.82 },
  optionSelected: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
});
