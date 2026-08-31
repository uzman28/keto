import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts, radius, spacing, tracking, typography } from '../theme';

/** Küçük kartlardaki dairesel gösterge. */
function MiniRing({ color, ratio }: { color: string; ratio: number }) {
  const r = 15;
  const circumference = 2 * Math.PI * r;

  return (
    <Svg height={34} style={styles.miniSvg} viewBox="0 0 36 36" width={34}>
      <Circle cx="18" cy="18" fill="none" r={r} stroke={colors.surfaceHighest} strokeWidth={3} />
      <Circle
        cx="18"
        cy="18"
        fill="none"
        r={r}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - Math.min(ratio, 1))}
        strokeLinecap="round"
        strokeWidth={3}
      />
    </Svg>
  );
}

interface LargeProps {
  consumed: number;
  icon: keyof typeof Ionicons.glyphMap;
  /** Net karbonhidrat gibi aşılmaması gereken hedeflerde true. */
  isCeiling?: boolean;
  target: number;
  title: string;
}

/**
 * Tam genişlik makro kartı. Sol kenardaki mor şerit ve alttaki çizgisel
 * gösterge tasarımın imzası; ekranda yalnızca bir tane bulunur.
 */
export function MacroCardLarge({ consumed, icon, isCeiling = false, target, title }: LargeProps) {
  const ratio = target > 0 ? consumed / target : 0;
  const isOver = ratio > 1;
  const barColor = isCeiling && isOver ? colors.danger : colors.accent;

  return (
    <View style={styles.large}>
      <View style={[styles.accentBar, { backgroundColor: barColor }]} />

      <View style={styles.largeTop}>
        <View>
          <Text style={styles.label}>{title.toUpperCase()}</Text>
          <View style={styles.valueRow}>
            <Text style={[styles.largeValue, isCeiling && isOver && styles.valueOver]}>
              {consumed}
            </Text>
            <Text style={styles.target}>/ {target}g</Text>
          </View>
        </View>

        <View style={styles.iconCircle}>
          <Ionicons color={barColor} name={icon} size={20} />
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { backgroundColor: barColor, width: `${Math.min(ratio, 1) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

interface SmallProps {
  color: string;
  consumed: number;
  target: number;
  title: string;
}

/** İkili ızgaradaki dar makro kartı: değer üstte, mini halka ve yüzde altta. */
export function MacroCardSmall({ color, consumed, target, title }: SmallProps) {
  const ratio = target > 0 ? consumed / target : 0;
  const percent = Math.round(ratio * 100);

  return (
    <View style={styles.small}>
      <View style={[styles.cornerGlow, { backgroundColor: color }]} />

      <Text style={styles.labelSmall}>{title.toUpperCase()}</Text>
      <Text style={styles.smallValue}>{consumed}</Text>
      <Text style={styles.target}>/ {target}g</Text>

      <View style={styles.smallFooter}>
        <MiniRing color={color} ratio={ratio} />
        <Text style={[styles.percent, { color }]}>%{percent}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accentBar: { bottom: 0, left: 0, position: 'absolute', top: 0, width: 3 },
  cornerGlow: {
    borderRadius: radius.pill,
    height: 64,
    opacity: 0.12,
    position: 'absolute',
    right: -20,
    top: -20,
    width: 64,
  },
  fill: { borderRadius: radius.pill, height: '100%' },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  label: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
    marginBottom: spacing.xs,
  },
  labelSmall: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: tracking.wide,
    marginBottom: spacing.xs,
  },
  large: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  largeTop: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  largeValue: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 30,
    letterSpacing: tracking.tight,
  },
  miniSvg: { transform: [{ rotate: '-90deg' }] },
  percent: { fontFamily: fonts.bold, fontSize: typography.small },
  small: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    flex: 1,
    overflow: 'hidden',
    padding: spacing.md,
  },
  smallFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  smallValue: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 24,
    letterSpacing: tracking.tight,
  },
  target: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  track: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 6,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  valueOver: { color: colors.danger },
  valueRow: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.xs },
});
