import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '../theme';

interface LabeledInputProps {
  keyboardType?: 'decimal-pad' | 'default' | 'number-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function LabeledInput({ keyboardType = 'default', label, onChangeText, placeholder, value }: LabeledInputProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  input: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    padding: spacing.lg,
  },
  label: { color: colors.text, fontSize: typography.body, fontFamily: fonts.medium },
});
