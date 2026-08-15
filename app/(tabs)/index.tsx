import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MacroCard } from '../../src/components/MacroCard';
import { Screen } from '../../src/components/Screen';
import { articles } from '../../src/data/articles';
import { calculateMacros } from '../../src/macros';
import { useProfile } from '../../src/profile-context';
import { colors, radius, spacing, typography } from '../../src/theme';

const disclaimer =
  'Bu uygulama yalnızca genel bilgilendirme amaçlıdır ve tıbbi tavsiye yerine geçmez. Hesaplanan değerler tahmini olup kişisel sağlık durumunuzu dikkate almaz. Diyet değişikliği yapmadan önce bir sağlık profesyoneline danışın.';

function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
}

export default function HomeScreen() {
  const { profile } = useProfile();

  if (!profile) {
    return null;
  }

  const targets = calculateMacros(profile);
  const dailyTip = articles[getDayOfYear(new Date()) % articles.length];

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.greeting}>Merhaba</Text>
        <Text style={styles.summary}>Günlük hedefin</Text>
      </View>

      <View style={styles.calorieCard}>
        <Text style={styles.calorieLabel}>GÜNLÜK KALORİ</Text>
        <Text style={styles.calorieValue}>{targets.calories}</Text>
        <Text style={styles.calorieUnit}>kcal</Text>
      </View>

      <View style={styles.macroRow}>
        <MacroCard calories={targets.fatG * 9} grams={targets.fatG} title="Yağ" />
        <MacroCard calories={targets.proteinG * 4} grams={targets.proteinG} title="Protein" />
        <MacroCard
          calories={targets.netCarbG * 4}
          grams={targets.netCarbG}
          highlighted
          title="Net karbonhidrat"
        />
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
    padding: spacing.xl,
  },
  calorieLabel: { color: colors.textMuted, fontSize: typography.small, fontWeight: '700', letterSpacing: 1 },
  calorieUnit: { color: colors.textMuted, fontSize: typography.body },
  calorieValue: { color: colors.text, fontSize: typography.display, fontWeight: '800', lineHeight: 66, marginTop: spacing.xs },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
  greeting: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  heading: { gap: spacing.xs },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  summary: { color: colors.textMuted, fontSize: typography.body },
  tipCard: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  tipCardPressed: { opacity: 0.8 },
  tipLabel: { color: colors.accent, fontSize: typography.small, fontWeight: '700', letterSpacing: 1 },
  tipLink: { color: colors.accent, fontSize: typography.small, fontWeight: '700', marginTop: spacing.xs },
  tipSummary: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  tipTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700', lineHeight: 27 },
});
