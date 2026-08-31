import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../src/components/AppHeader';
import { Screen } from '../../src/components/Screen';
import { WeightChart } from '../../src/components/WeightChart';
import { addDays, getDateKey } from '../../src/date';
import { calculateMacros, sumMacros } from '../../src/macros';
import { useProfile } from '../../src/profile-context';
import { getEntriesForDate, getWeightEntries, getWeightGoal } from '../../src/storage';
import { colors, fonts, radius, spacing, tracking, typography } from '../../src/theme';
import type { WeightEntry } from '../../src/types';

type Range = '1A' | '3A' | 'TÜMÜ';

const RANGE_DAYS: Record<Range, number> = { '1A': 30, '3A': 90, 'TÜMÜ': 3650 };

interface Achievement {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  unlocked: boolean;
}

export default function ProgressScreen() {
  const { profile } = useProfile();
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goal, setGoal] = useState<number | null>(null);
  const [range, setRange] = useState<Range>('1A');
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const [weights, weightGoal] = await Promise.all([getWeightEntries(), getWeightGoal()]);
        setEntries(weights);
        setGoal(weightGoal);

        if (!profile) {
          return;
        }

        // Net karbonhidrat hedefinin altında kalınan kesintisiz gün sayısı.
        const targets = calculateMacros(profile);
        let count = 0;
        for (let offset = 0; offset < 60; offset += 1) {
          const dayEntries = await getEntriesForDate(getDateKey(addDays(new Date(), -offset)));
          if (dayEntries.length === 0) {
            break;
          }
          if (sumMacros(dayEntries).netCarbG > targets.netCarbG) {
            break;
          }
          count += 1;
        }
        setStreak(count);
      }

      void load();
    }, [profile]),
  );

  if (!profile) {
    return null;
  }

  const cutoff = getDateKey(addDays(new Date(), -RANGE_DAYS[range]));
  const visible = entries.filter((entry) => entry.date >= cutoff);

  const current = entries.at(-1)?.weightKg ?? profile.weightKg;
  const start = entries[0]?.weightKg ?? profile.weightKg;
  const weekAgo = getDateKey(addDays(new Date(), -7));
  const weekStart = entries.filter((entry) => entry.date <= weekAgo).at(-1)?.weightKg ?? start;
  const weekDelta = current - weekStart;

  const goalProgress =
    goal !== null && start !== goal
      ? Math.max(0, Math.min(1, (start - current) / (start - goal)))
      : 0;
  const toGo = goal !== null ? current - goal : null;

  const achievements: Achievement[] = [
    { icon: 'flame', label: `${streak} GÜN`, unlocked: streak > 0 },
    { icon: 'scale-outline', label: `${entries.length} ÖLÇÜM`, unlocked: entries.length > 0 },
    { icon: 'trophy', label: 'HEDEF', unlocked: goal !== null && current <= goal },
  ];

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader title="İlerleme" />

      <View style={styles.headingGroup}>
        <Text style={styles.title}>YOLCULUĞUN</Text>
        <Text style={styles.subtitle}>Hedefine doğru ilerlemen.</Text>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <View style={[styles.cardGlow, { backgroundColor: colors.accent }]} />
          <Text style={styles.statLabel}>ŞU AN</Text>
          <View style={styles.valueRow}>
            <Text style={styles.statValue}>{current.toFixed(1)}</Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
          <View style={styles.deltaRow}>
            <Ionicons
              color={weekDelta <= 0 ? colors.success : colors.warning}
              name={weekDelta <= 0 ? 'arrow-down' : 'arrow-up'}
              size={14}
            />
            <Text
              style={[styles.deltaText, { color: weekDelta <= 0 ? colors.success : colors.warning }]}>
              {Math.abs(weekDelta).toFixed(1)} kg / hafta
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/weight')}
          style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}>
          <View style={[styles.cardGlow, { backgroundColor: colors.accentSoft }]} />
          <Text style={styles.statLabel}>HEDEF</Text>
          <View style={styles.valueRow}>
            <Text style={styles.statValue}>{goal !== null ? goal.toFixed(1) : '—'}</Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
          {goal !== null ? (
            <>
              <View style={styles.goalTrack}>
                <View style={[styles.goalFill, { width: `${goalProgress * 100}%` }]} />
              </View>
              <Text style={styles.goalNote}>
                {toGo !== null && toGo > 0 ? `${toGo.toFixed(1)} kg kaldı` : 'hedefe ulaşıldı'}
              </Text>
            </>
          ) : (
            <Text style={styles.goalNote}>hedef belirle →</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Kilo eğrisi</Text>
          <View style={styles.rangePills}>
            {(['1A', '3A', 'TÜMÜ'] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: range === option }}
                onPress={() => setRange(option)}
                style={[styles.rangePill, range === option && styles.rangePillActive]}>
                <Text
                  style={[styles.rangeText, range === option && styles.rangeTextActive]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {visible.length >= 2 ? (
          <WeightChart entries={visible} />
        ) : (
          <View style={styles.chartEmpty}>
            <Text style={styles.chartEmptyText}>
              Eğri için en az iki ölçüm gerekiyor.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/weight')}
              style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.chartEmptyLink}>ÖLÇÜM EKLE</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Başarımlar</Text>
        <View style={styles.badgeRow}>
          {achievements.map((item) => (
            <View
              key={item.label}
              style={[styles.badge, !item.unlocked && styles.badgeLocked]}>
              <Ionicons
                color={item.unlocked ? colors.accent : colors.textFaint}
                name={item.unlocked ? item.icon : 'lock-closed'}
                size={26}
              />
              <Text style={[styles.badgeText, !item.unlocked && styles.badgeTextLocked]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/weight')}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
        <Ionicons color={colors.background} name="add" size={18} />
        <Text style={styles.ctaText}>ÖLÇÜM EKLE</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.accentSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  badgeLocked: { borderColor: colors.border },
  badgeRow: { flexDirection: 'row', gap: spacing.md },
  badgeText: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: tracking.wide,
  },
  badgeTextLocked: { color: colors.textFaint },
  cardGlow: {
    borderRadius: radius.pill,
    height: 80,
    opacity: 0.1,
    position: 'absolute',
    right: -26,
    top: -26,
    width: 80,
  },
  chartCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  chartEmpty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  chartEmptyLink: {
    color: colors.accent,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  chartEmptyText: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  chartHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  chartTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.section },
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
  deltaRow: { alignItems: 'center', flexDirection: 'row', gap: 3, marginTop: spacing.xs },
  deltaText: { fontFamily: fonts.bold, fontSize: typography.small },
  goalFill: { backgroundColor: colors.accent, borderRadius: radius.pill, height: '100%' },
  goalNote: {
    color: colors.textFaint,
    fontFamily: fonts.regular,
    fontSize: 10,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  goalTrack: {
    backgroundColor: colors.surfaceHighest,
    borderRadius: radius.pill,
    height: 5,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  headingGroup: { gap: spacing.xs },
  pressed: { opacity: 0.8 },
  rangePill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  rangePillActive: { backgroundColor: colors.surfaceContainer },
  rangePills: {
    backgroundColor: colors.surfaceHighest,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: 3,
  },
  rangeText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 11 },
  rangeTextActive: { color: colors.text },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.section },
  statCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    flex: 1,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  statGrid: { flexDirection: 'row', gap: spacing.md },
  statLabel: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: tracking.wide,
    marginBottom: spacing.sm,
  },
  statUnit: { color: colors.accent, fontFamily: fonts.medium, fontSize: typography.small },
  statValue: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 34,
    letterSpacing: tracking.tight,
  },
  subtitle: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  title: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 30,
    letterSpacing: tracking.tight,
  },
  valueRow: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.xs },
});
