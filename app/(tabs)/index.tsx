import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CalorieRing } from '../../src/components/CalorieRing';
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
import { colors, fonts, radius, spacing, text, tracking, typography } from '../../src/theme';
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
  const dayOfYear = getDayOfYear(selectedDate);
  const dailyTip = articles[dayOfYear % articles.length];
  const featuredFood = foods[dayOfYear % foods.length];
  // Vitrin her gün kayarak farklı besinleri öne çıkarsın diye günden türetiliyor.
  const deckFoods = [
    featuredFood,
    ...foods
      .filter((food) => food.id !== featuredFood.id)
      .slice(dayOfYear % 20, (dayOfYear % 20) + 9),
  ];

  async function handleRemove(entryId: string) {
    setEntries(await removeLogEntry(selectedDateKey, entryId));
  }

  async function handleWaterChange(delta: number) {
    setGlasses(await changeWaterForDate(selectedDateKey, delta));
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isViewingToday ? 'Bugün' : 'Geçmiş'}</Text>
          <Text style={styles.eyebrow}>{formatDayLabel(selectedDate)}</Text>
        </View>

        <View style={styles.dateNav}>
          <Pressable
            accessibilityLabel="Önceki gün"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={() => setSelectedDate(addDays(selectedDate, -1))}
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
            <Ionicons color={colors.textMuted} name="chevron-back" size={18} />
          </Pressable>
          <Pressable
            accessibilityLabel="Sonraki gün"
            accessibilityRole="button"
            disabled={isViewingToday}
            hitSlop={spacing.sm}
            onPress={() => setSelectedDate(addDays(selectedDate, 1))}
            style={({ pressed }) => [
              styles.navButton,
              isViewingToday && styles.navButtonDisabled,
              pressed && styles.pressed,
            ]}>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
          </Pressable>
        </View>
      </View>

      {!isViewingToday ? (
        <Pressable
          accessibilityRole="button"
          onPress={goToToday}
          style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}>
          <Text style={styles.todayButtonText}>BUGÜNE DÖN</Text>
        </Pressable>
      ) : null}

      <CalorieRing consumed={consumed.kcal} target={targets.calories} />

      {/* Makrolar kutusuz akıyor — ayrımı boşluk yapıyor, çerçeve değil. */}
      <View style={styles.macroGroup}>
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
          <Text style={styles.sectionLabel}>
            {isViewingToday ? 'BUGÜN YEDİKLERİN' : 'O GÜN YEDİKLERİ'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/add-entry')}
            style={({ pressed }) => [styles.addLink, pressed && styles.pressed]}>
            <Ionicons color={colors.accent} name="add" size={15} />
            <Text style={styles.addLinkText}>EKLE</Text>
          </Pressable>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons color={colors.textFaint} name="restaurant-outline" size={26} />
            <Text style={styles.emptyTitle}>Kayıt yok</Text>
            <Text style={styles.emptyText}>
              Yukarıdaki "Ekle" ile yiyecek arayabilir, tariflerden seçebilir ya da değerleri
              kendin girebilirsin.
            </Text>
          </View>
        ) : (
          <View style={styles.entryList}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={[styles.entryRow, index > 0 && styles.entryRowDivider]}>
                <View style={styles.entryAccent} />
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
                  <Ionicons color={colors.textFaint} name="close" size={18} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>KETOYA UYGUN MU?</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/foods')}
            style={({ pressed }) => [styles.addLink, pressed && styles.pressed]}>
            <Text style={styles.addLinkText}>TÜMÜ</Text>
            <Ionicons color={colors.accent} name="chevron-forward" size={13} />
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
        <View style={styles.tipGlow} />
        <Text style={styles.tipLabel}>GÜNÜN İPUCU</Text>
        <Text style={styles.tipTitle}>{dailyTip.title}</Text>
        <Text style={styles.tipSummary}>{dailyTip.summary}</Text>
      </Pressable>

      <Text style={styles.disclaimer}>{disclaimer}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addLink: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  addLinkText: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  dateNav: { flexDirection: 'row', gap: spacing.sm },
  deckContent: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  deckScroller: { marginHorizontal: -spacing.xl },
  disclaimer: {
    color: colors.textFaint,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyText: { ...text.caption, color: colors.textFaint, lineHeight: 19, textAlign: 'center' },
  emptyTitle: { ...text.title, fontSize: typography.body },
  /** Sol kenardaki ince mor şerit — kayıtları listeden ayıran imza detay. */
  entryAccent: { backgroundColor: colors.accent, borderRadius: radius.pill, height: 28, width: 2 },
  entryInfo: { flex: 1, gap: 3 },
  entryList: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  entryMeta: { ...text.caption, color: colors.textFaint },
  entryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  entryRowDivider: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  entryTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.body },
  eyebrow: { ...text.eyebrow, marginTop: 2 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  macroGroup: { gap: spacing.lg },
  navButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  navButtonDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
  section: { gap: spacing.md },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionLabel: text.sectionLabel,
  tipCard: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  /** Köşedeki mor parıltı; kartı diğerlerinden ayıran tek dekoratif öğe. */
  tipGlow: {
    backgroundColor: colors.accentSurface,
    borderRadius: radius.pill,
    height: 120,
    position: 'absolute',
    right: -50,
    top: -60,
    width: 120,
  },
  tipLabel: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  tipSummary: { ...text.caption, lineHeight: 20 },
  tipTitle: { ...text.title, lineHeight: 26 },
  title: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: typography.heading,
    letterSpacing: tracking.tight,
    textTransform: 'uppercase',
  },
  todayButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSurface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  todayButtonText: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
});
