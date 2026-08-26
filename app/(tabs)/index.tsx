import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FoodTile } from '../../src/components/FoodTile';
import { MacroBar } from '../../src/components/MacroBar';
import { Screen } from '../../src/components/Screen';
import { WaterCard } from '../../src/components/WaterCard';
import { articles } from '../../src/data/articles';
import { foods } from '../../src/data/foods';
import { addDays, formatDayLabel } from '../../src/date';
import { useDay } from '../../src/day-context';
import { calculateMacros, sumMacros } from '../../src/macros';
import { useProfile } from '../../src/profile-context';
import {
  changeWaterForDate,
  getEntriesForDate,
  getWaterForDate,
  removeLogEntry,
} from '../../src/storage';
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
  const { goToToday, isViewingToday, selectedDate, selectedDateKey, setSelectedDate } = useDay();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [glasses, setGlasses] = useState(0);

  // Tarif detayından ve elle ekleme ekranından dönülebildiği için her odaklanmada okuyoruz.
  useFocusEffect(
    useCallback(() => {
      async function loadDay() {
        const [dayEntries, dayGlasses] = await Promise.all([
          getEntriesForDate(selectedDateKey),
          getWaterForDate(selectedDateKey),
        ]);
        setEntries(dayEntries);
        setGlasses(dayGlasses);
      }

      void loadDay();
    }, [selectedDateKey]),
  );

  if (!profile) {
    return null;
  }

  const targets = calculateMacros(profile);
  const consumed = sumMacros(entries);
  const remainingCalories = targets.calories - consumed.kcal;
  const dayOfYear = getDayOfYear(selectedDate);
  const dailyTip = articles[dayOfYear % articles.length];
  const featuredFood = foods[dayOfYear % foods.length];
  // Vitrin her gun kayarak farkli besinleri one cikarsin diye gunden turetiliyor.
  const deckFoods = [
    featuredFood,
    ...foods.filter((food) => food.id !== featuredFood.id).slice(dayOfYear % 20, (dayOfYear % 20) + 9),
  ];

  async function handleRemove(entryId: string) {
    setEntries(await removeLogEntry(selectedDateKey, entryId));
  }

  async function handleWaterChange(delta: number) {
    setGlasses(await changeWaterForDate(selectedDateKey, delta));
  }

  return (
    <Screen>
      <View style={styles.dateRow}>
        <Pressable
          accessibilityLabel="Önceki gün"
          accessibilityRole="button"
          hitSlop={spacing.sm}
          onPress={() => setSelectedDate(addDays(selectedDate, -1))}
          style={({ pressed }) => [styles.dateArrow, pressed && styles.pressed]}>
          <Ionicons color={colors.text} name="chevron-back" size={20} />
        </Pressable>

        <View style={styles.dateLabels}>
          <Text style={styles.greeting}>{isViewingToday ? 'Bugün' : 'Geçmiş gün'}</Text>
          <Text style={styles.summary}>{formatDayLabel(selectedDate)}</Text>
        </View>

        <Pressable
          accessibilityLabel="Sonraki gün"
          accessibilityRole="button"
          disabled={isViewingToday}
          hitSlop={spacing.sm}
          onPress={() => setSelectedDate(addDays(selectedDate, 1))}
          style={({ pressed }) => [
            styles.dateArrow,
            isViewingToday && styles.dateArrowDisabled,
            pressed && styles.pressed,
          ]}>
          <Ionicons color={colors.text} name="chevron-forward" size={20} />
        </Pressable>
      </View>

      {!isViewingToday ? (
        <Pressable
          accessibilityRole="button"
          onPress={goToToday}
          style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}>
          <Text style={styles.todayButtonText}>Bugüne dön</Text>
        </Pressable>
      ) : null}

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

      <WaterCard glasses={glasses} onChange={(delta) => void handleWaterChange(delta)} />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{isViewingToday ? 'Bugün yediklerin' : 'O gün yedikleri'}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/add-entry')}
            style={({ pressed }) => [styles.addLink, pressed && styles.pressed]}>
            <Ionicons color={colors.accent} name="add" size={16} />
            <Text style={styles.addLinkText}>Ekle</Text>
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons color={colors.textMuted} name="restaurant-outline" size={28} />
            <Text style={styles.emptyTitle}>Kayıt yok</Text>
            <Text style={styles.emptyText}>
              Yukarıdaki "Ekle" ile yiyecek arayabilir, tariflerden seçebilir ya da
              değerleri kendin girebilirsin.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/recipes')}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.emptyLink}>Tariflere git →</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.entryList}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={[styles.entryRow, index > 0 && styles.entryRowDivider]}>
                <View style={styles.entryInfo}>
                  <Text numberOfLines={1} style={styles.entryTitle}>
                    {entry.title}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {entry.servings ? `${entry.servings} porsiyon · ` : ''}
                    {entry.grams ? `${entry.grams} g · ` : ''}
                    {entry.macros.kcal} kcal · {entry.macros.netCarbG} g net karb.
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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ketoya uygun mu?</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/foods')}
            style={({ pressed }) => [styles.addLink, pressed && styles.pressed]}>
            <Text style={styles.addLinkText}>Tüm besinler</Text>
            <Ionicons color={colors.accent} name="chevron-forward" size={14} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deckContent}
          style={styles.deckScroller}>
          {deckFoods.map((food, index) => (
            <FoodTile
              key={food.id}
              eyebrow={index === 0 ? 'GÜNÜN BESİNİ' : undefined}
              food={food}
              onPress={() => router.push({ pathname: '/foods', params: { focus: food.id } })}
            />
          ))}
        </ScrollView>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/article/[id]', params: { id: dailyTip.id } })}
        style={({ pressed }) => [styles.tipCard, pressed && styles.pressed]}>
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
  addLink: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  addLinkText: { color: colors.accent, fontSize: typography.small, fontWeight: '700' },
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
  dateArrow: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  dateArrowDisabled: { opacity: 0.3 },
  dateLabels: { alignItems: 'center', flex: 1, gap: spacing.xs },
  dateRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  deckContent: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  deckScroller: { marginHorizontal: -spacing.xl },
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
  macroCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.lg, padding: spacing.lg },
  pressed: { opacity: 0.8 },
  section: { gap: spacing.md },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700' },
  summary: { color: colors.textMuted, fontSize: typography.small },
  tipCard: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  tipLabel: { color: colors.accent, fontSize: typography.small, fontWeight: '700', letterSpacing: 1 },
  tipLink: { color: colors.accent, fontSize: typography.small, fontWeight: '700', marginTop: spacing.xs },
  tipSummary: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  tipTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700', lineHeight: 27 },
  todayButton: { alignItems: 'center', borderColor: colors.accent, borderRadius: radius.pill, borderWidth: 1, paddingVertical: spacing.sm },
  todayButtonText: { color: colors.accent, fontSize: typography.small, fontWeight: '700' },
});
