import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

interface MacroBarProps {
  consumed: number;
  /**
   * Net karbonhidrat gibi aşılmaması gereken hedeflerde true.
   * Aşıldığında çubuk ve kalan yazısı uyarı rengine döner.
   */
  isCeiling?: boolean;
  title: string;
  target: number;
  unit: string;
}

export function MacroBar({ consumed, isCeiling = false, title, target, unit }: MacroBarProps) {
  const remaining = target - consumed;
  const isOver = remaining < 0;
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;
  const barColor = isCeiling && isOver ? colors.danger : colors.accent;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.amount}>
          <Text style={styles.consumed}>{consumed}</Text>
          <Text style={styles.target}>
            {' / '}
            {target} {unit}
          </Text>
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: barColor, width: `${ratio * 100}%` }]} />
      </View>

      <Text style={[styles.remaining, isCeiling && isOver && styles.remainingOver]}>
        {isOver
          ? `${Math.abs(remaining)} ${unit} ${isCeiling ? 'aşıldı' : 'fazla'}`
          : `${remaining} ${unit} kaldı`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { color: colors.textMuted, fontSize: typography.small },
  consumed: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  container: { gap: spacing.xs },
  fill: { borderRadius: radius.pill, height: '100%' },
  labelRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  remaining: { color: colors.textMuted, fontSize: typography.small },
  remainingOver: { color: colors.danger, fontWeight: '700' },
  target: { color: colors.textMuted, fontSize: typography.small },
  title: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  track: { backgroundColor: colors.surfaceElevated, borderRadius: radius.pill, height: 10, overflow: 'hidden' },
});
