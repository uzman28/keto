import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../src/components/AppHeader';
import { MacroCardLarge, MacroCardSmall } from '../../src/components/MacroCards';
import { Screen } from '../../src/components/Screen';
import { recipes } from '../../src/data/recipes';
import { addDays, formatDayLabel, getDateKey } from '../../src/date';
import { useDay } from '../../src/day-context';
import { calculateMacros, sumMacros } from '../../src/macros';
import { useProfile } from '../../src/profile-context';
import { getEntriesForDate, removeLogEntry } from '../../src/storage';
import { colors, fonts, radius, spacing, text, tracking, typography } from '../../src/theme';
import type { LogEntry, MealType } from '../../src/types';

type Tab = 'gun' | 'hafta' | 'makro';

const mealLabels: Record<MealType, string> = {
  aksam: 'AKŞAM',
  atistirmalik: 'ARA ÖĞÜN',
  kahvalti: 'KAHVALTI',
  ogle: 'ÖĞLE',
  tatli: 'TATLI',
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MealsScreen() {
  const { selectedDate, selectedDateKey } = useDay();
  const { profile } = useProfile();
  const [tab, setTab] = useState<Tab>('gun');
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [week, setWeek] = useState<Array<{ dateKey: string; entries: LogEntry[] }>>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setEntries(await getEntriesForDate(selectedDateKey));

        const days = await Promise.all(
          Array.from({ length: 7 }, async (_unused, offset) => {
            const dateKey = getDateKey(addDays(new Date(), -offset));
            return { dateKey, entries: await getEntriesForDate(dateKey) };
          }),
        );
        setWeek(days);
      }

      void load();
    }, [selectedDateKey]),
  );

  if (!profile) {
    return null;
  }

  const targets = calculateMacros(profile);
  const consumed = sumMacros(entries);

  async function handleRemove(entryId: string) {
    setEntries(await removeLogEntry(selectedDateKey, entryId));
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader title="Öğünler" />

      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={styles.title}>GÜNÜN YAKITI</Text>
          <Text style={styles.subtitle}>{formatDayLabel(selectedDate)}</Text>
        </View>
        <View style={styles.limitBox}>
          <Text style={styles.limitValue}>{targets.calories.toLocaleString('tr-TR')}</Text>
          <Text style={styles.limitLabel}>KCAL SINIR</Text>
        </View>
      </View>

      <View style={styles.segments}>
        {(
          [
            { label: 'GÜN', value: 'gun' },
            { label: 'HAFTA', value: 'hafta' },
            { label: 'MAKRO', value: 'makro' },
          ] as const
        ).map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === option.value }}
            onPress={() => setTab(option.value)}
            style={[styles.segment, tab === option.value && styles.segmentActive]}>
            <Text style={[styles.segmentText, tab === option.value && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'gun' ? (
        <View style={styles.timeline}>
          {entries.map((entry, index) => {
            const recipe = entry.recipeId
              ? recipes.find((item) => item.id === entry.recipeId)
              : undefined;

            return (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.timelineGutter}>
                  <Text style={styles.timeText}>{formatTime(entry.createdAt)}</Text>
                  <View style={styles.dotOuter}>
                    <View style={styles.dotInner} />
                  </View>
                  {index < entries.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  onLongPress={() => void handleRemove(entry.id)}
                  onPress={() =>
                    entry.recipeId
                      ? router.push({ pathname: '/recipe/[id]', params: { id: entry.recipeId } })
                      : undefined
                  }
                  style={({ pressed }) => [styles.mealCard, pressed && styles.pressed]}>
                  <View style={styles.thumb}>
                    {recipe ? (
                      <Image resizeMode="cover" source={recipe.image} style={styles.thumbImage} />
                    ) : (
                      <View style={styles.thumbFallback}>
                        <Ionicons color={colors.textFaint} name="nutrition-outline" size={26} />
                      </View>
                    )}
                    <View style={styles.thumbScrim} />
                    {entry.mealType ? (
                      <Text style={styles.thumbLabel}>{mealLabels[entry.mealType]}</Text>
                    ) : null}
                  </View>

                  <View style={styles.mealBody}>
                    <Text numberOfLines={2} style={styles.mealTitle}>
                      {entry.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.mealMeta}>
                      {entry.servings ? `${entry.servings} porsiyon` : ''}
                      {entry.grams ? `${entry.grams} g` : ''}
                    </Text>

                    <View style={styles.chipRow}>
                      <View style={styles.chip}>
                        <Ionicons color={colors.success} name="flame" size={13} />
                        <Text style={styles.chipValue}>{entry.macros.kcal}</Text>
                      </View>
                      <View style={styles.chip}>
                        <View style={styles.chipDot} />
                        <Text style={styles.chipMuted}>{entry.macros.netCarbG}g NK</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}

          <View style={styles.timelineRow}>
            <View style={styles.timelineGutter}>
              <Text style={styles.timeText}>—:—</Text>
              <View style={styles.dotEmpty} />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/add-entry')}
              style={({ pressed }) => [styles.awaiting, pressed && styles.pressed]}>
              <Ionicons color={colors.textFaint} name="add-circle-outline" size={30} />
              <Text style={styles.awaitingText}>KAYIT BEKLENİYOR</Text>
            </Pressable>
          </View>
        </View>
      ) : tab === 'hafta' ? (
        <View style={styles.weekList}>
          {week.map((day) => {
            const dayMacros = sumMacros(day.entries);
            const ratio = targets.calories > 0 ? dayMacros.kcal / targets.calories : 0;
            const isOverCarb = dayMacros.netCarbG > targets.netCarbG;

            return (
              <View key={day.dateKey} style={styles.weekRow}>
                <View style={styles.weekInfo}>
                  <Text style={styles.weekDate}>
                    {formatDayLabel(new Date(`${day.dateKey}T12:00:00`))}
                  </Text>
                  <Text style={styles.weekMeta}>
                    {day.entries.length} kayıt · {dayMacros.kcal} kcal · {dayMacros.netCarbG} g NK
                  </Text>
                  <View style={styles.weekTrack}>
                    <View
                      style={[
                        styles.weekFill,
                        {
                          backgroundColor: isOverCarb ? colors.danger : colors.accent,
                          width: `${Math.min(ratio, 1) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
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
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/recipes')}
        style={({ pressed }) => [styles.recipeLink, pressed && styles.pressed]}>
        <Ionicons color={colors.accent} name="book-outline" size={17} />
        <Text style={styles.recipeLinkText}>TARİFLERE GÖZ AT</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  awaiting: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  awaitingText: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  chip: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  chipDot: { backgroundColor: colors.accent, borderRadius: radius.pill, height: 7, width: 7 },
  chipMuted: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: typography.small },
  chipRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  chipValue: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.small },
  content: { gap: spacing.lg },
  dotEmpty: {
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  dotInner: { backgroundColor: colors.accent, borderRadius: radius.pill, height: 6, width: 6 },
  dotOuter: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  headingRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  headingText: { flex: 1 },
  limitBox: { alignItems: 'flex-end' },
  limitLabel: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: tracking.wide,
  },
  limitValue: {
    color: colors.accent,
    fontFamily: fonts.black,
    fontSize: 26,
    letterSpacing: tracking.tight,
  },
  macroGrid: { gap: spacing.md },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  mealBody: { flex: 1, justifyContent: 'center', paddingRight: spacing.md, paddingVertical: spacing.sm },
  mealCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.xs,
  },
  mealMeta: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  mealTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.body, lineHeight: 21 },
  pressed: { opacity: 0.8 },
  recipeLink: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  recipeLinkText: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    paddingVertical: spacing.md,
  },
  segmentActive: { backgroundColor: colors.accent },
  segmentText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  segmentTextActive: { color: colors.background },
  segments: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  subtitle: { ...text.eyebrow, marginTop: 3 },
  thumb: { borderRadius: radius.sm, height: 92, overflow: 'hidden', width: 92 },
  thumbFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  thumbImage: { height: '100%', width: '100%' },
  thumbLabel: {
    bottom: spacing.sm,
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 10,
    left: spacing.sm,
    letterSpacing: tracking.wide,
    position: 'absolute',
  },
  thumbScrim: {
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  timeText: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    marginBottom: spacing.sm,
  },
  timeline: { gap: spacing.lg },
  timelineGutter: { alignItems: 'center', paddingTop: spacing.xs, width: 52 },
  /** Noktaları birleştiren dikey çizgi; son kayıtta çizilmiyor. */
  timelineLine: {
    backgroundColor: colors.accentStrong,
    bottom: -spacing.xl,
    top: 40,
    position: 'absolute',
    width: 2,
  },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  title: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 30,
    letterSpacing: tracking.tight,
  },
  weekDate: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.body },
  weekFill: { borderRadius: radius.pill, height: '100%' },
  weekInfo: { flex: 1, gap: spacing.xs },
  weekList: { gap: spacing.md },
  weekMeta: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  weekRow: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  weekTrack: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.pill,
    height: 5,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
});
