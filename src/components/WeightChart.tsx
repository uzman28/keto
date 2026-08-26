import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors, radius, spacing, typography } from '../theme';
import type { WeightEntry } from '../types';

const CHART_HEIGHT = 160;
const PADDING_X = 8;
const PADDING_Y = 12;

interface WeightChartProps {
  entries: WeightEntry[];
}

/**
 * Basit çizgi grafik. Genişliği onLayout ile ölçüyoruz çünkü SVG'nin piksel
 * koordinatlara ihtiyacı var, yüzde ile nokta konumlandıramıyoruz.
 */
export function WeightChart({ entries }: WeightChartProps) {
  const [width, setWidth] = useState(0);

  const weights = entries.map((entry) => entry.weightKg);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight;
  const isFlat = range === 0;

  const innerWidth = Math.max(width - PADDING_X * 2, 1);
  const innerHeight = CHART_HEIGHT - PADDING_Y * 2;

  const points = entries.map((entry, index) => {
    // Tüm ölçümler aynıysa oran hesaplanamaz; çizgiyi grafiğin ortasına koyuyoruz.
    const ratio = isFlat ? 0.5 : (entry.weightKg - minWeight) / range;

    return {
      x: PADDING_X + (entries.length === 1 ? innerWidth / 2 : (index / (entries.length - 1)) * innerWidth),
      y: PADDING_Y + innerHeight - ratio * innerHeight,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>{maxWeight} kg</Text>
        <Text style={styles.scaleText}>{minWeight} kg</Text>
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.chartArea}>
        {width > 0 ? (
          <Svg height={CHART_HEIGHT} width={width}>
            <Line
              stroke={colors.border}
              strokeDasharray="4 4"
              strokeWidth={1}
              x1={PADDING_X}
              x2={width - PADDING_X}
              y1={PADDING_Y}
              y2={PADDING_Y}
            />
            <Line
              stroke={colors.border}
              strokeDasharray="4 4"
              strokeWidth={1}
              x1={PADDING_X}
              x2={width - PADDING_X}
              y1={CHART_HEIGHT - PADDING_Y}
              y2={CHART_HEIGHT - PADDING_Y}
            />

            {entries.length > 1 ? (
              <Path
                d={linePath}
                fill="none"
                stroke={colors.accent}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
              />
            ) : null}

            {points.map((point, index) => (
              <Circle
                cx={point.x}
                cy={point.y}
                fill={colors.background}
                key={entries[index].date}
                r={4}
                stroke={colors.accent}
                strokeWidth={2.5}
              />
            ))}
          </Svg>
        ) : null}
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>{entries[0].date.slice(5).replace('-', '.')}</Text>
        <Text style={styles.scaleText}>
          {entries[entries.length - 1].date.slice(5).replace('-', '.')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  chartArea: { height: CHART_HEIGHT },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scaleText: { color: colors.textMuted, fontSize: typography.small },
});
