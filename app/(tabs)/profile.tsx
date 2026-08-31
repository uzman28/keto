import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../src/components/AppHeader';
import { Screen } from '../../src/components/Screen';
import { addDays, getDateKey } from '../../src/date';
import { calculateMacros, sumMacros } from '../../src/macros';
import { useProfile } from '../../src/profile-context';
import { clearProfile, getEntriesForDate, getWeightEntries } from '../../src/storage';
import { colors, fonts, radius, spacing, tracking, typography } from '../../src/theme';
import type { Goal } from '../../src/types';

const goalLabels: Record<Goal, string> = {
  gain: 'KİLO ALMA',
  lose: 'KİLO VERME',
  maintain: 'KİLO KORUMA',
};

interface RowProps {
  color?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  subtitle: string;
  title: string;
}

function SettingRow({ color = colors.accent, icon, onPress, subtitle, title }: RowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, { backgroundColor: `${color}1f` }]}>
        <Ionicons color={color} name={icon} size={19} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons color={colors.textFaint} name="chevron-forward" size={18} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const [logDays, setLogDays] = useState(0);
  const [streak, setStreak] = useState(0);
  const [measurements, setMeasurements] = useState(0);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        if (!profile) {
          return;
        }

        const targets = calculateMacros(profile);
        let days = 0;
        let run = 0;
        let runBroken = false;

        for (let offset = 0; offset < 90; offset += 1) {
          const entries = await getEntriesForDate(getDateKey(addDays(new Date(), -offset)));
          if (entries.length > 0) {
            days += 1;
            if (!runBroken && sumMacros(entries).netCarbG <= targets.netCarbG) {
              run += 1;
            } else {
              runBroken = true;
            }
          } else if (offset > 0) {
            runBroken = true;
          }
        }

        setLogDays(days);
        setStreak(run);
        setMeasurements((await getWeightEntries()).length);
      }

      void load();
    }, [profile]),
  );

  if (!profile) {
    return null;
  }

  function handleReset() {
    Alert.alert(
      'Profili sıfırla',
      'Profilin ve hesaplanan hedeflerin silinecek; yeniden bilgi girmen istenecek. Favori tariflerin, günlük kayıtların, su ve kilo ölçümlerin korunur. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const didClear = await clearProfile();
              if (!didClear) {
                Alert.alert('Silinemedi', 'Verilerin silinemedi. Lütfen yeniden deneyin.');
                return;
              }
              updateProfile(null);
            })();
          },
        },
      ],
    );
  }

  const targets = calculateMacros(profile);

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader title="Profil" />

      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons color={colors.accent} name="person" size={44} />
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{goalLabels[profile.goal]}</Text>
          </View>
        </View>

        <Text style={styles.name}>
          {profile.age} yaş · {profile.heightCm} cm
        </Text>
        <Text style={styles.member}>KETO TAKİPÇİSİ</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Kayıtlı gün</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{logDays}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Seri</Text>
          <Text style={[styles.statValue, { color: colors.accent }]}>
            {streak}
            <Text style={styles.statSuffix}>g</Text>
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Ölçüm</Text>
          <Text style={styles.statValue}>{measurements}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>HESAP</Text>
        <View style={styles.rowGroup}>
          <SettingRow
            icon="person-outline"
            onPress={() => router.push('/onboarding')}
            subtitle="Yaş, boy, kilo, aktivite ve hedef"
            title="Bilgilerim"
          />
          <SettingRow
            color={colors.success}
            icon="flame-outline"
            onPress={() => router.push('/foods')}
            subtitle={`Günlük ${targets.calories} kcal · ${targets.netCarbG} g net karb`}
            title="Hedeflerim"
          />
          <SettingRow
            color={colors.accentSoft}
            icon="scale-outline"
            onPress={() => router.push('/weight')}
            subtitle="Ölçüm ekle, hedef kilo belirle"
            title="Kilo takibi"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>İÇERİK</Text>
        <View style={styles.rowGroup}>
          <SettingRow
            icon="book-outline"
            onPress={() => router.push('/guide')}
            subtitle="Keto hakkında kısa yazılar"
            title="Rehber"
          />
          <SettingRow
            color={colors.success}
            icon="nutrition-outline"
            onPress={() => router.push('/foods')}
            subtitle="Hangi besin serbest, hangisi değil"
            title="Besinler"
          />
          <SettingRow
            color={colors.warning}
            icon="restaurant-outline"
            onPress={() => router.push('/recipes')}
            subtitle="Ketoya uygun 12 tarif"
            title="Tarifler"
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={handleReset}
        style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
        <Ionicons color={colors.danger} name="log-out-outline" size={17} />
        <Text style={styles.signOutText}>PROFİLİ SIFIRLA</Text>
      </Pressable>

      <Text style={styles.footnote}>
        Bilgilerin yalnızca bu cihazda saklanır. Hesaplanan değerler tahminidir ve tıbbi tavsiye
        yerine geçmez.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 108,
    justifyContent: 'center',
    width: 108,
  },
  avatarWrap: { alignItems: 'center' },
  content: { gap: spacing.lg },
  footnote: {
    color: colors.textFaint,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },
  identity: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md },
  levelBadge: {
    backgroundColor: colors.surfaceHigh,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    borderWidth: 1,
    bottom: -10,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    position: 'absolute',
  },
  levelText: {
    color: colors.accent,
    fontFamily: fonts.black,
    fontSize: 10,
    letterSpacing: tracking.wide,
  },
  member: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 22,
    letterSpacing: tracking.tight,
    marginTop: spacing.md,
  },
  pressed: { opacity: 0.8 },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  rowGroup: { gap: spacing.sm },
  rowIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowSubtitle: { color: colors.textFaint, fontFamily: fonts.regular, fontSize: typography.small },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: typography.body },
  section: { gap: spacing.md },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  signOut: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  signOutText: {
    color: colors.danger,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
  },
  stat: { alignItems: 'center', flex: 1, gap: spacing.xs },
  statCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    flexDirection: 'row',
    paddingVertical: spacing.lg,
  },
  statDivider: { backgroundColor: colors.border, width: StyleSheet.hairlineWidth },
  statLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: typography.small },
  statSuffix: { fontSize: typography.small },
  statValue: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: 24,
    letterSpacing: tracking.tight,
  },
});
