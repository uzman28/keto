import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts, spacing, tracking, typography } from '../theme';

interface CalorieRingProps {
  consumed: number;
  size?: number;
  target: number;
}

const STROKE = 10;
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Ekranın odak noktası. Tasarımın "imza" öğesi olduğu için tek bir yerde
 * kullanılıyor — çoğaltılırsa vurgu olmaktan çıkar.
 *
 * Halka -90° döndürülüyor ki dolum saat 12'den başlasın; SVG'de 0° saat 3'tür.
 */
export function CalorieRing({ consumed, size = 260, target }: CalorieRingProps) {
  const remaining = target - consumed;
  const isOver = remaining < 0;
  const ratio = target > 0 ? Math.min(consumed / target, 1) : 0;
  const ringColor = isOver ? colors.danger : colors.accent;

  return (
    <View style={[styles.container, { height: size, width: size }]}>
      <Svg height={size} style={styles.svg} viewBox="0 0 100 100" width={size}>
        <Circle
          cx="50"
          cy="50"
          fill="none"
          r={RADIUS}
          stroke={colors.surfaceHigh}
          strokeWidth={STROKE}
        />
        <Circle
          cx="50"
          cy="50"
          fill="none"
          r={RADIUS}
          stroke={ringColor}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
          strokeLinecap="round"
          strokeWidth={STROKE}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={[styles.value, isOver && styles.valueOver]}>
          {Math.abs(remaining).toLocaleString('tr-TR')}
        </Text>
        <Text style={[styles.label, isOver && styles.labelOver]}>
          {isOver ? 'KALORİ AŞILDI' : 'KALORİ KALDI'}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.footnote}>
          {consumed.toLocaleString('tr-TR')} / {target.toLocaleString('tr-TR')} kcal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  container: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center' },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: spacing.sm, width: 44 },
  footnote: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  label: {
    color: colors.accent,
    fontFamily: fonts.medium,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
    marginTop: spacing.xs,
  },
  labelOver: { color: colors.danger },
  svg: { transform: [{ rotate: '-90deg' }] },
  value: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: typography.display,
    letterSpacing: tracking.tight,
    lineHeight: 62,
  },
  valueOver: { color: colors.danger },
});
