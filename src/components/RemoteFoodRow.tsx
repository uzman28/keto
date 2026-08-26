import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchRemoteFood } from '../food-remote';
import type { RemoteFood, RemoteFoodResult } from '../food-remote';
import { macrosForGrams } from '../macros';
import { colors, radius, spacing, typography } from '../theme';

interface RemoteFoodRowProps {
  isExpanded: boolean;
  onAdd: (food: RemoteFood, grams: number) => void;
  onToggle: () => void;
  result: RemoteFoodResult;
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
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.name}>
            {result.name}
            {result.brand ? <Text style={styles.brand}> · {result.brand}</Text> : null}
          </Text>
          <Text style={styles.meta}>
            {summary
              ? `${summary.servingLabel}: ${summary.kcal} kcal · ${summary.carbG} g karb`
              : 'Ayrıntı için dokun'}
          </Text>
        </View>

        <Ionicons
          color={isExpanded ? colors.accent : colors.textMuted}
          name={isExpanded ? 'chevron-up' : 'add-circle-outline'}
          size={24}
        />
      </Pressable>

      {isExpanded ? (
        <View style={styles.detail}>
          {isLoading ? (
            <View style={styles.centerRow}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={styles.loadingText}>Değerler alınıyor…</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : detail && portion ? (
            <>
              {detail.fiberMissing ? (
                <View style={styles.warningRow}>
                  <Ionicons color={colors.warning} name="alert-circle" size={16} />
                  <Text style={styles.warningText}>
                    Lif bilgisi yok; net karbonhidrat olduğundan yüksek görünebilir.
                  </Text>
                </View>
              ) : null}

              {detail.portions.length > 1 ? (
                <View style={styles.portionRow}>
                  {detail.portions.slice(0, 6).map((option, index) => (
                    <Pressable
                      key={`${option.label}-${option.grams}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: index === portionIndex }}
                      onPress={() => setPortionIndex(index)}
                      style={({ pressed }) => [
                        styles.portionChip,
                        index === portionIndex && styles.portionChipSelected,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.portionChipText,
                          index === portionIndex && styles.portionChipTextSelected,
                        ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View style={styles.counterRow}>
                <Text style={styles.counterLabel}>Adet</Text>
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
                    <Ionicons color={colors.text} name="remove" size={18} />
                  </Pressable>
                  <Text style={styles.counterValue}>{count}</Text>
                  <Pressable
                    accessibilityLabel="Artır"
                    accessibilityRole="button"
                    hitSlop={spacing.sm}
                    onPress={() => setCount((value) => Math.min(20, value + 0.5))}
                    style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}>
                    <Ionicons color={colors.text} name="add" size={18} />
                  </Pressable>
                </View>
                <Text style={styles.gramsText}>{grams} g</Text>
              </View>

              {macros ? (
                <Text style={styles.macroLine}>
                  {macros.kcal} kcal · {macros.fatG} g yağ · {macros.proteinG} g protein ·{' '}
                  <Text style={styles.macroHighlight}>{macros.netCarbG} g net karb</Text>
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => onAdd(detail, grams)}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <Text style={styles.addButtonText}>Güne ekle</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.errorText}>Bu kaydın gram karşılığı yok, eklenemiyor.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.sm, padding: spacing.md },
  addButtonText: { color: colors.background, fontSize: typography.body, fontWeight: '700' },
  brand: { color: colors.textMuted, fontWeight: '400' },
  centerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  counter: { alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: radius.pill, flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  counterButton: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  counterButtonDisabled: { opacity: 0.3 },
  counterLabel: { color: colors.textMuted, fontSize: typography.small, fontWeight: '600' },
  counterRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  counterValue: { color: colors.text, fontSize: typography.body, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  detail: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.md, padding: spacing.lg },
  errorText: { color: colors.danger, fontSize: typography.small, lineHeight: 19 },
  gramsText: { color: colors.textMuted, fontSize: typography.small, marginLeft: 'auto' },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerText: { flex: 1, gap: 2 },
  loadingText: { color: colors.textMuted, fontSize: typography.small },
  macroHighlight: { color: colors.accent, fontWeight: '700' },
  macroLine: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  meta: { color: colors.textMuted, fontSize: typography.small },
  name: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  portionChip: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  portionChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  portionChipText: { color: colors.textMuted, fontSize: typography.small, fontWeight: '600' },
  portionChipTextSelected: { color: colors.background },
  portionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pressed: { opacity: 0.8 },
  row: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  warningRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  warningText: { color: colors.warning, flex: 1, fontSize: typography.small, lineHeight: 18 },
});
