import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MacroBar } from '../../src/components/MacroBar';
import { Screen } from '../../src/components/Screen';
import { articles } from '../../src/data/articles';
import { formatDayLabel, getDateKey } from '../../src/date';
import { calculateMacros, sumMacros } from '../../src/macros';
import { useProfile } from '../../src/profile-context';
import { getEntriesForDate, removeLogEntry } from '../../src/storage';
import { colors, radius, spacing, typography } from '../../src/theme';
import type { LogEntry } from '../../src/types';

const disclaimer =
  'Bu uygulama yalnızca genel bilgilendirme amaçlıdır ve tıbbi tavsiye yerine geçmez. Hesaplanan değerler tahmini olup kişisel sağlık durumunuzu dikkate almaz. Diyet değişikliği yapmadan önce bir sağlık profesyoneline danışın.';

function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
}

export default function HomeScreen() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState<LogEntry[]>([]);

  // Tarif detayından güne ekleme yapılabildiği için her odaklanmada yeniden okuyoruz.
  useFocusEffect(
    useCallback(() => {
      async function loadEntries() {
        setEntries(await getEntriesForDate(getDateKey()));
      }

      void loadEntries();
    }, []),
  );

  if (!profile) {
    return null;
  }

  const targets = calculateMacros(profile);
  const consumed = sumMacros(entries);
  const remainingCalories = targets.calories - consumed.kcal;
  const dailyTip = articles[getDayOfYear(new Date()) % articles.length];

  async function handleRemove(entryId: string) {
    setEntries(await removeLogEntry(getDateKey(), entryId));
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.greeting}>Bugün</Text>
        <Text style={styles.summary}>{formatDayLabel()}</Text>
      </View>

      <View style={styles.calorieCard}>
        <Text style={styles.calorieLabel}>
          {remainingCalories >= 0 ? 'KALAN KALORİ' : 'HEDEF AŞILDI'}
        </Text>
        <Text style={[styles.calorieValue, remainingCalories < 0 && styles.calorieValueOver]}>
          {Math.abs(remainingCalories)}
        </Text>
        <Text style={styles.calorieUnit}>
          {consumed.kcal} / {targets.calories} kcal alındı
        </Text>
        <View style={styles.calorieTrack}>
          <View
            style={[
              styles.calorieFill,
              {
                backgroundColor: remainingCalories < 0 ? colors.danger : colors.accent,
                width: `${Math.min(consumed.kcal / targets.calories, 1) * 100}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.macroCard}>
        <MacroBar consumed={consumed.fatG} target={targets.fatG} title="Yağ" unit="g" />
        <MacroBar consumed={consumed.proteinG} target={targets.proteinG} title="Protein" unit="g" />
        <MacroBar
          consumed={consumed.netCarbG}
          isCeiling
          target={targets.netCarbG}
          title="Net karbonhidrat"
          unit="g"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bugün yediklerin</Text>
        {entries.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/recipes')}
            style={({ pressed }) => [styles.emptyCard, pressed && styles.pressed]}>
            <Ionicons color={colors.textMuted} name="restaurant-outline" size={28} />
            <Text style={styles.emptyTitle}>Henüz bir şey eklemedin</Text>
            <Text style={styles.emptyText}>
              Tarifler sekmesinden bir tarif seçip "Güne ekle" ile buraya kaydedebilirsin.
            </Text>
            <Text style={styles.emptyLink}>Tariflere git →</Text>
          </Pressable>
        ) : (
          <View style={styles.entryList}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={[styles.entryRow, index > 0 && styles.entryRowDivider]}>
                <View style={styles.entryInfo}>
                  <Text numberOfLines={1} style={styles.entryTitle}>
                    {entry.title}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {entry.servings} porsiyon · {entry.macros.kcal} kcal ·{' '}
                    {entry.macros.netCarbG} g net karb.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={`${entry.title} kaydını sil`}
                  accessibilityRole="button"
                  hitSlop={spacing.sm}
                  onPress={() => void handleRemove(entry.id)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Ionicons color={colors.textMuted} name="close-circle-outline" size={24} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/article/[id]', params: { id: dailyTip.id } })}
        style={({ pressed }) => [styles.tipCard, pressed && styles.tipCardPressed]}>
        <Text style={styles.tipLabel}>GÜNÜN İPUCU</Text>
        <Text style={styles.tipTitle}>{dailyTip.title}</Text>
        <Text style={styles.tipSummary}>{dailyTip.summary}</Text>
        <Text style={styles.tipLink}>Oku →</Text>
      </Pressable>

      <Text style={styles.disclaimer}>{disclaimer}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  calorieCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.xl,
  },
  calorieFill: { borderRadius: radius.pill, height: '100%' },
  calorieLabel: { color: colors.textMuted, fontSize: typography.small, fontWeight: '700', letterSpacing: 1 },
  calorieTrack: { backgroundColor: colors.surfaceElevated, borderRadius: radius.pill, height: 10, marginTop: spacing.sm, overflow: 'hidden', width: '100%' },
  calorieUnit: { color: colors.textMuted, fontSize: typography.body },
  calorieValue: { color: colors.text, fontSize: typography.display, fontWeight: '800', lineHeight: 66 },
  calorieValueOver: { color: colors.danger },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderStyle: 'dashed', borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  emptyLink: { color: colors.accent, fontSize: typography.small, fontWeight: '700', marginTop: spacing.xs },
  emptyText: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  entryInfo: { flex: 1, gap: spacing.xs },
  entryList: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  entryMeta: { color: colors.textMuted, fontSize: typography.small },
  entryRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  entryRowDivider: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  entryTitle: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  greeting: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  heading: { gap: spacing.xs },
  macroCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.lg, padding: spacing.lg },
  pressed: { opacity: 0.8 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700' },
  summary: { color: colors.textMuted, fontSize: typography.body },
  tipCard: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  tipCardPressed: { opacity: 0.8 },
  tipLabel: { color: colors.accent, fontSize: typography.small, fontWeight: '700', letterSpacing: 1 },
  tipLink: { color: colors.accent, fontSize: typography.small, fontWeight: '700', marginTop: spacing.xs },
  tipSummary: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  tipTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700', lineHeight: 27 },
});
