import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LabeledInput } from '../src/components/LabeledInput';
import { WeightChart } from '../src/components/WeightChart';
import { formatDayLabel, getDateKey } from '../src/date';
import { getWeightEntries, removeWeightEntry, saveWeightEntry } from '../src/storage';
import { colors, radius, spacing, typography } from '../src/theme';
import type { WeightEntry } from '../src/types';

function parseWeight(value: string): number {
  return Number(value.replace(',', '.'));
}

function formatDelta(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;

  if (rounded === 0) {
    return 'Değişim yok';
  }

  return rounded > 0 ? `+${rounded} kg` : `${rounded} kg`;
}

export default function WeightScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadEntries() {
        setEntries(await getWeightEntries());
      }

      void loadEntries();
    }, []),
  );

  const parsedWeight = parseWeight(weight);
  const weightError = !weight.trim()
    ? null
    : !Number.isFinite(parsedWeight) || parsedWeight < 35 || parsedWeight > 250
      ? 'Kilo 35-250 kg arasında olmalı.'
      : null;
  const isValid = weight.trim().length > 0 && !weightError;

  const first = entries[0];
  const latest = entries[entries.length - 1];
  const todayKey = getDateKey();
  const hasTodayEntry = entries.some((entry) => entry.date === todayKey);

  async function handleSave() {
    if (!isValid) {
      return;
    }

    setIsSaving(true);
    const updated = await saveWeightEntry({
      date: todayKey,
      weightKg: Math.round(parsedWeight * 10) / 10,
    });
    setIsSaving(false);
    setEntries(updated);
    setWeight('');
  }

  function handleRemove(dateKey: string) {
    Alert.alert('Kaydı sil', 'Bu ölçüm silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setEntries(await removeWeightEntry(dateKey));
          })();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboardView}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Geri</Text>
        </Pressable>

        <View style={styles.headingGroup}>
          <Text style={styles.title}>Kilo takibi</Text>
          <Text style={styles.intro}>
            Gün başına tek ölçüm tutulur. Aynı güne yeniden girersen önceki değer güncellenir.
          </Text>
        </View>

        {entries.length > 0 ? (
          <View style={styles.summaryRow}>
            <SummaryTile label="Başlangıç" value={`${first.weightKg} kg`} />
            <SummaryTile label="Şu an" value={`${latest.weightKg} kg`} />
            <SummaryTile
              highlighted
              label="Değişim"
              value={formatDelta(latest.weightKg - first.weightKg)}
            />
          </View>
        ) : null}

        {entries.length > 0 ? <WeightChart entries={entries} /> : null}

        <View style={styles.section}>
          <LabeledInput
            keyboardType="decimal-pad"
            label={hasTodayEntry ? 'Bugünkü ölçümü güncelle (kg)' : 'Bugünkü ölçüm (kg)'}
            onChangeText={setWeight}
            placeholder="Örn. 82.4"
            value={weight}
          />
          {weightError ? <Text style={styles.error}>{weightError}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={!isValid || isSaving}
            onPress={() => void handleSave()}
            style={[styles.submitButton, (!isValid || isSaving) && styles.submitButtonDisabled]}>
            <Text style={styles.submitText}>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz ölçüm yok</Text>
            <Text style={styles.emptyText}>
              İlk kilonu girdiğinde grafik ve değişim özeti burada görünecek.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Geçmiş ölçümler</Text>
            <View style={styles.list}>
              {[...entries].reverse().map((entry, index) => (
                <Pressable
                  key={entry.date}
                  accessibilityLabel={`${entry.date} ölçümünü sil`}
                  accessibilityRole="button"
                  onLongPress={() => handleRemove(entry.date)}
                  style={({ pressed }) => [
                    styles.listRow,
                    index > 0 && styles.listRowDivider,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.listDate}>
                    {formatDayLabel(new Date(`${entry.date}T00:00:00`))}
                  </Text>
                  <Text style={styles.listValue}>{entry.weightKg} kg</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.hint}>Bir ölçümü silmek için satırına basılı tut.</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryTile({
  highlighted = false,
  label,
  value,
}: {
  highlighted?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.tile, highlighted && styles.tileHighlighted]}>
      <Text style={[styles.tileValue, highlighted && styles.tileValueHighlighted]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  backText: { color: colors.accent, fontSize: typography.body, fontWeight: '700' },
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderStyle: 'dashed', borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  error: { color: colors.danger, fontSize: typography.small },
  headingGroup: { gap: spacing.sm },
  hint: { color: colors.textMuted, fontSize: typography.small },
  intro: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  keyboardView: { backgroundColor: colors.background, flex: 1 },
  list: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  listDate: { color: colors.text, flex: 1, fontSize: typography.body },
  listRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  listRowDivider: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  listValue: { color: colors.accent, fontSize: typography.body, fontWeight: '700' },
  pressed: { opacity: 0.8 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700' },
  submitButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.lg },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { color: colors.background, fontSize: typography.body, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  tile: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flex: 1, gap: spacing.xs, paddingHorizontal: spacing.xs, paddingVertical: spacing.md },
  tileHighlighted: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  tileLabel: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
  tileValue: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  tileValueHighlighted: { color: colors.accent },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
});
