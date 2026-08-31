import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../src/components/AppHeader';
import { CalorieRing } from '../../src/components/CalorieRing';
import { FoodTile } from '../../src/components/FoodTile';
import { MacroCardLarge, MacroCardSmall } from '../../src/components/MacroCards';
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
  const { goToToday, isViewingToday, selectedDate, selectedDateKey, setSelectedDate } = useDay();
  const { profile } = useProfile();
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
  const deckFoods = [
    featuredFood,
    ...foods
      .filter((food) => food.id !== featuredFood.id)
      .slice(dayOfYear % 20, (dayOfYear % 20) + 9),
  ];

  const isCarbOver = consumed.netCarbG > targets.netCarbG;

  async function handleRemove(entryId: string) {
    setEntries(await removeLogEntry(selectedDateKey, entryId));
  }

  async function handleWaterChange(delta: number) {
    setGlasses(await changeWaterForDate(selectedDateKey, delta));
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader
        right={
          <View style={styles.dateNav}>
            <Pressable
              accessibilityLabel="Önceki gün"
              accessibilityRole="button"
              hitSlop={spacing.sm}
              onPress={() => setSelectedDate(addDays(selectedDate, -1))}
              style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
              <Ionicons color={colors.textMuted} name="chevron-back" size={17} />
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
              <Ionicons color={colors.textMuted} name="chevron-forward" size={17} />
            </Pressable>
          </View>
        }
        title="Panel"
      />

      {/* Başlık bloğu + durum rozeti */}
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>{isViewingToday ? 'BUGÜN' : 'GEÇMİŞ'}</Text>
          <Text style={styles.eyebrow}>{formatDayLabel(selectedDate)}</Text>
        </View>

        {isViewingToday ? (
          <View style={[styles.badge, isCarbOver && styles.badgeDanger]}>
            <View style={[styles.badgeDot, isCarbOver && styles.badgeDotDanger]} />
            <Text style={[styles.badgeText, isCarbOver && styles.badgeTextDanger]}>
              {isCarbOver ? 'AŞILDI' : 'HEDEFTE'}
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={goToToday}
            style={({ pressed }) => [styles.badge, pressed && styles.pressed]}>
            <Text style={styles.badgeText}>BUGÜNE DÖN</Text>
          </Pressable>
        )}
      </View>

      <CalorieRing consumed={consumed.kcal} target={targets.calories} />

      {/* Günün ipucu — tasarımdaki "AI Insight" kartının karşılığı */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/article/[id]', params: { id: dailyTip.id } })}
        style={({ pressed }) => [styles.insight, pressed && styles.pressed]}>
        <View style={styles.insightGlow} />
        <View style={styles.insightIcon}>
          <Ionicons color={colors.accent} name="bulb-outline" size={20} />
        </View>
        <View style={styles.insightBody}>
          <Text style={styles.insightLabel}>GÜNÜN İPUCU</Text>
          <Text style={styles.insightText}>{dailyTip.title}</Text>
        </View>
      </Pressable>

      {/* Asimetrik makro ızgarası: net karbonhidrat büyük, diğer ikisi dar */}
      <View style={styles.macroGrid}>
        <MacroCardLarge
          consumed={consumed.netCarbG}
          icon="flame"
          isCeiling
          target={targets.netCarbG}
          title="Net karbonhidrat"
        />
        <View style={styles.macroRow}>
          <MacroCardSmall
            color={colors.success}
            consumed={consumed.proteinG}
            target={targets.proteinG}
            title="Protein"
          />
          <MacroCardSmall
            color={colors.accentSoft}
            consumed={consumed.fatG}
            target={targets.fatG}
            title="Yağ"
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/add-entry')}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
        <Ionicons color={colors.background} name="add" size={19} />
        <Text style={styles.ctaText}>YİYECEK EKLE</Text>
      </Pressable>

      <WaterCard glasses={glasses} onChange={(delta) => void handleWaterChange(delta)} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {isViewingToday ? 'BUGÜN YEDİKLERİN' : 'O GÜN YEDİKLERİ'}
        </Text>

        {entries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons color={colors.textFaint} name="add-circle-outline" size={28} />
            <Text style={styles.emptyText}>KAYIT BEKLENİYOR</Text>
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
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={styles.linkText}>TÜMÜ</Text>
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

      <Text style={styles.disclaimer}>{disclaimer}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.accentSurface,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  badgeDanger: { backgroundColor: colors.dangerSurface },
  badgeDot: { backgroundColor: colors.accent, borderRadius: radius.pill, height: 6, width: 6 },
  badgeDotDanger: { backgroundColor: colors.danger },
  badgeText: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: tracking.wide,
  },
  badgeTextDanger: { color: colors.danger },
  brandText: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: typography.body,
    letterSpacing: tracking.tight,
  },
  content: { gap: spacing.lg },
  cta: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  ctaPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  ctaText: {
    color: colors.background,
    fontFamily: fonts.black,
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
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
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
  eyebrow: { ...text.eyebrow, marginTop: 3 },
  headingRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headingText: { flex: 1 },
  insight: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceHighest,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  insightBody: { flex: 1, gap: spacing.xs },
  /** Sağ üst köşedeki mor parıltı — tasarımın cam efektini taklit ediyor. */
  insightGlow: {
    backgroundColor: colors.accentSurface,
    borderRadius: radius.pill,
    height: 110,
    position: 'absolute',
    right: -34,
    top: -44,
    width: 110,
  },
  insightIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSurface,
    borderColor: colors.accentStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  insightLabel: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: tracking.wide,
  },
  insightText: { ...text.body, fontFamily: fonts.medium, lineHeight: 22 },
  link: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  linkText: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.accentSurface,
    borderRadius: radius.sm,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  macroGrid: { gap: spacing.md },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  navButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  navButtonDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
  section: { gap: spacing.md },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionLabel: text.sectionLabel,
  title: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 34,
    letterSpacing: tracking.tight,
    lineHeight: 36,
  },
});
