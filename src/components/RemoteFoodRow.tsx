import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchRemoteFood } from '../food-remote';
import type { RemoteFood, RemoteFoodResult } from '../food-remote';
import { macrosForGrams } from '../macros';
import { colors, fonts, radius, spacing, tracking, typography } from '../theme';

interface RemoteFoodRowProps {
  isExpanded: boolean;
  onAdd: (food: RemoteFood, grams: number) => void;
  onToggle: () => void;
  result: RemoteFoodResult;
}

/** Dört sütunlu makro şeridi: etiket üstte, değer altta. */
function MacroCell({
  highlighted = false,
  label,
  value,
}: {
  highlighted?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.macroCell}>
      <Text style={styles.macroCellLabel}>{label}</Text>
      <Text style={[styles.macroCellValue, highlighted && styles.macroCellValueAccent]}>
        {value}
      </Text>
    </View>
  );
}

export function RemoteFoodRow({ isExpanded, onAdd, onToggle, result }: RemoteFoodRowProps) {
  const [detail, setDetail] = useState<RemoteFood | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portionIndex, setPortionIndex] = useState(0);
  const [count, setCount] = useState(1);

  // Detay yalnızca açılınca çekiliyor — 50 sonucun tamamı için çekmek kotayı yakardı.
  useEffect(() => {
    if (!isExpanded || detail || isLoading) {
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchRemoteFood(result.id, controller.signal)
      .then((food) => setDetail(food))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(cause instanceof Error ? cause.message : 'Ayrıntı alınamadı.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [detail, isExpanded, isLoading, result.id]);

  const summary = result.summary;
  const portion = detail?.portions[portionIndex] ?? detail?.portions[0];
  const grams = portion ? Math.round(portion.grams * count) : 0;
  const macros = detail && grams > 0 ? macrosForGrams(detail.per100g, grams) : null;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.iconBox}>
          <Ionicons color={colors.accent} name="nutrition-outline" size={22} />
        </View>

        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.name}>
            {result.name}
          </Text>
          <Text numberOfLines={1} style={styles.serving}>
            {result.brand ? `${result.brand} · ` : ''}
            {summary ? summary.servingLabel : 'ayrıntı için dokun'}
          </Text>
        </View>

        <Ionicons
          color={colors.textFaint}
          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
          size={20}
        />
      </Pressable>

      {/* Kapalıyken de özet makrolar görünüyor — tasarımdaki dört sütunlu şerit. */}
      {summary && !isExpanded ? (
        <>
          <View style={styles.divider} />
          <View style={styles.macroStrip}>
            <MacroCell highlighted label="Kalori" value={`${summary.kcal}`} />
            <MacroCell label="Protein" value={`${summary.proteinG}g`} />
            <MacroCell label="Karb." value={`${summary.carbG}g`} />
            <MacroCell label="Yağ" value={`${summary.fatG}g`} />
          </View>
        </>
      ) : null}

      {isExpanded ? (
        <>
          <View style={styles.divider} />
          <View style={styles.detail}>
            {isLoading ? (
              <View style={styles.centerRow}>
                <ActivityIndicator color={colors.accent} size="small" />
                <Text style={styles.loadingText}>Değerler alınıyor…</Text>
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : detail && portion && macros ? (
              <>
                {detail.fiberMissing ? (
                  <View style={styles.warningRow}>
                    <Ionicons color={colors.warning} name="alert-circle" size={15} />
                    <Text style={styles.warningText}>
                      Lif bilgisi yok; net karbonhidrat olduğundan yüksek görünebilir.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.macroStripFlush}>
                  <MacroCell highlighted label="Kalori" value={`${macros.kcal}`} />
                  <MacroCell label="Protein" value={`${macros.proteinG}g`} />
                  <MacroCell label="Net karb." value={`${macros.netCarbG}g`} />
                  <MacroCell label="Yağ" value={`${macros.fatG}g`} />
                </View>

                {detail.portions.length > 1 ? (
                  <View style={styles.portionRow}>
                    {detail.portions.slice(0, 6).map((option, index) => (
                      <Pressable
                        key={`${option.label}-${option.grams}`}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: index === portionIndex }}
                        onPress={() => setPortionIndex(index)}
                        style={({ pressed }) => [
                          styles.chip,
                          index === portionIndex && styles.chipSelected,
                          pressed && styles.pressed,
                        ]}>
                        <Text
                          style={[
                            styles.chipText,
                            index === portionIndex && styles.chipTextSelected,
                          ]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <View style={styles.counterRow}>
                  <Text style={styles.counterLabel}>ADET</Text>
                  <View style={styles.counter}>
                    <Pressable
                      accessibilityLabel="Azalt"
                      accessibilityRole="button"
                      disabled={count <= 0.5}
                      hitSlop={spacing.sm}
                      onPress={() => setCount((value) => Math.max(0.5, value - 0.5))}
                      style={({ pressed }) => [
                        styles.counterButton,
                        count <= 0.5 && styles.counterButtonDisabled,
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons color={colors.text} name="remove" size={17} />
                    </Pressable>
                    <Text style={styles.counterValue}>{count}</Text>
                    <Pressable
                      accessibilityLabel="Artır"
                      accessibilityRole="button"
                      hitSlop={spacing.sm}
                      onPress={() => setCount((value) => Math.min(20, value + 0.5))}
                      style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}>
                      <Ionicons color={colors.text} name="add" size={17} />
                    </Pressable>
                  </View>
                  <Text style={styles.gramsText}>{grams} g</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => onAdd(detail, grams)}
                  style={({ pressed }) => [styles.addButton, pressed && styles.ctaPressed]}>
                  <Ionicons color={colors.background} name="add" size={17} />
                  <Text style={styles.addButtonText}>GÜNE EKLE</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.errorText}>Bu kaydın gram karşılığı yok, eklenemiyor.</Text>
            )}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  addButtonText: {
    color: colors.background,
    fontFamily: fonts.black,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  card: { backgroundColor: colors.surfaceContainer, borderRadius: radius.md, overflow: 'hidden' },
  centerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  chip: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: typography.small },
  chipTextSelected: { color: colors.background, fontFamily: fonts.bold },
  counter: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  counterButton: { alignItems: 'center', height: 26, justifyContent: 'center', width: 26 },
  counterButtonDisabled: { opacity: 0.3 },
  counterLabel: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: tracking.wide,
  },
  counterRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  counterValue: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: typography.body,
    minWidth: 26,
    textAlign: 'center',
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  detail: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md },
  divider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  errorText: { color: colors.danger, fontFamily: fonts.regular, fontSize: typography.small },
  gramsText: {
    color: colors.textFaint,
    fontFamily: fonts.regular,
    fontSize: typography.small,
    marginLeft: 'auto',
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  headerText: { flex: 1, gap: 3 },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  loadingText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: typography.small },
  macroCell: { alignItems: 'center', flex: 1, gap: 3 },
  macroCellLabel: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  macroCellValue: { color: colors.text, fontFamily: fonts.black, fontSize: typography.body },
  macroCellValueAccent: { color: colors.accent },
  macroStrip: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  macroStripFlush: { flexDirection: 'row' },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.body },
  portionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pressed: { opacity: 0.75 },
  serving: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  warningRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  warningText: {
    color: colors.warning,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: typography.small,
    lineHeight: 18,
  },
});
