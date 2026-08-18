import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { calculateMacros } from '../../src/macros';
import { useProfile } from '../../src/profile-context';
import { clearProfile } from '../../src/storage';
import { colors, radius, spacing, typography } from '../../src/theme';
import type { ActivityLevel, Goal } from '../../src/types';

const activityLabels: Record<ActivityLevel, string> = {
  high: 'Çok aktif',
  light: 'Hafif aktif',
  moderate: 'Orta aktif',
  sedentary: 'Sedanter',
};

const goalLabels: Record<Goal, string> = {
  gain: 'Kilo almak',
  lose: 'Kilo vermek',
  maintain: 'Kilomu korumak',
};

export default function SettingsScreen() {
  const { profile, updateProfile } = useProfile();

  if (!profile) {
    return null;
  }

  const targets = calculateMacros(profile);

  function handleReset() {
    Alert.alert(
      'Verileri sıfırla',
      'Profilin ve hesaplanan hedeflerin silinecek. Favori tariflerin ve günlük kayıtların korunur. Devam edilsin mi?',
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

  return (
    <Screen>
      <Text style={styles.title}>Ayarlar</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bilgilerin</Text>
        <View style={styles.card}>
          <InfoRow label="Cinsiyet" value={profile.gender === 'female' ? 'Kadın' : 'Erkek'} />
          <InfoRow label="Yaş" value={`${profile.age}`} />
          <InfoRow label="Boy" value={`${profile.heightCm} cm`} />
          <InfoRow label="Kilo" value={`${profile.weightKg} kg`} />
          <InfoRow label="Aktivite" value={activityLabels[profile.activity]} />
          <InfoRow label="Hedef" value={goalLabels[profile.goal]} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesaplanan hedefler</Text>
        <View style={styles.card}>
          <InfoRow label="Bazal metabolizma (BMR)" value={`${targets.bmr} kcal`} />
          <InfoRow label="Günlük yakım (TDEE)" value={`${targets.tdee} kcal`} />
          <InfoRow highlighted label="Günlük kalori hedefi" value={`${targets.calories} kcal`} />
          <InfoRow label="Yağ" value={`${targets.fatG} g`} />
          <InfoRow label="Protein" value={`${targets.proteinG} g`} />
          <InfoRow label="Net karbonhidrat" value={`${targets.netCarbG} g`} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>Bilgilerimi güncelle</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleReset}
          style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}>
          <Text style={styles.dangerButtonText}>Verileri sıfırla</Text>
        </Pressable>
      </View>

      <Text style={styles.footnote}>
        Bilgilerin yalnızca bu cihazda saklanır, hiçbir sunucuya gönderilmez. Hesaplanan değerler
        tahminidir ve tıbbi tavsiye yerine geçmez.
      </Text>
    </Screen>
  );
}

function InfoRow({
  highlighted = false,
  label,
  value,
}: {
  highlighted?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlighted && styles.rowValueHighlighted]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  dangerButton: { alignItems: 'center', borderColor: colors.danger, borderRadius: radius.md, borderWidth: 1, padding: spacing.lg },
  dangerButtonText: { color: colors.danger, fontSize: typography.body, fontWeight: '700' },
  footnote: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
  pressed: { opacity: 0.8 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.lg },
  primaryButtonText: { color: colors.background, fontSize: typography.body, fontWeight: '700' },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowLabel: { color: colors.textMuted, flex: 1, fontSize: typography.body },
  rowValue: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  rowValueHighlighted: { color: colors.accent },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700' },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
});
