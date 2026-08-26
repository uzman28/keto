import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LabeledInput } from '../src/components/LabeledInput';
import { SelectableOption } from '../src/components/SelectableOption';
import { useProfile } from '../src/profile-context';
import { saveProfile } from '../src/storage';
import { colors, radius, spacing, typography } from '../src/theme';
import type { ActivityLevel, Gender, Goal } from '../src/types';

const activityOptions: Array<{ description: string; title: string; value: ActivityLevel }> = [
  { value: 'sedentary', title: 'Sedanter', description: 'Masa başı iş, düzenli egzersiz yok' },
  { value: 'light', title: 'Hafif aktif', description: 'Haftada 1-3 gün hafif egzersiz' },
  { value: 'moderate', title: 'Orta aktif', description: 'Haftada 3-5 gün egzersiz' },
  { value: 'high', title: 'Çok aktif', description: 'Haftada 6-7 gün yoğun egzersiz veya fiziksel iş' },
];

const goalOptions: Array<{ title: string; value: Goal }> = [
  { value: 'lose', title: 'Kilo vermek' },
  { value: 'maintain', title: 'Kilomu korumak' },
  { value: 'gain', title: 'Kilo almak' },
];

function numberError(value: string, label: string, min: number, max: number, integer = false) {
  const parsedValue = Number(value.replace(',', '.'));
  if (!value.trim() || !Number.isFinite(parsedValue) || (integer && !Number.isInteger(parsedValue))) {
    return `${label} geçerli bir sayı olmalı.`;
  }
  return parsedValue < min || parsedValue > max ? `${label} ${min}-${max} arasında olmalı.` : null;
}

export default function OnboardingScreen() {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [age, setAge] = useState(profile ? String(profile.age) : '');
  const [heightCm, setHeightCm] = useState(profile ? String(profile.heightCm) : '');
  const [weightKg, setWeightKg] = useState(profile ? String(profile.weightKg) : '');
  const [activity, setActivity] = useState<ActivityLevel | null>(profile?.activity ?? null);
  const [goal, setGoal] = useState<Goal | null>(profile?.goal ?? null);
  const [isSaving, setIsSaving] = useState(false);

  const ageError = numberError(age, 'Yaş', 15, 90, true);
  const heightError = numberError(heightCm, 'Boy', 120, 220);
  const weightError = numberError(weightKg, 'Kilo', 35, 250);
  const isValid = Boolean(gender && activity && goal && !ageError && !heightError && !weightError);

  async function handleSubmit() {
    if (!isValid || !gender || !activity || !goal) {
      return;
    }

    setIsSaving(true);
    const nextProfile = {
      gender,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg.replace(',', '.')),
      activity,
      goal,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
    };
    const didSave = await saveProfile(nextProfile);
    setIsSaving(false);

    if (!didSave) {
      Alert.alert('Kayıt yapılamadı', 'Bilgilerin kaydedilemedi. Lütfen yeniden deneyin.');
      return;
    }

    updateProfile(nextProfile);
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboardView}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>KETOYA HOŞ GELDİN</Text>
        <Text style={styles.title}>Günlük hedeflerini hesaplayalım</Text>
        <Text style={styles.intro}>Bilgilerin yalnızca bu cihazda saklanır.</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Cinsiyet</Text>
          <View style={styles.genderGroup}>
            {(['female', 'male'] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === option }}
                onPress={() => setGender(option)}
                style={[styles.genderButton, gender === option && styles.genderButtonSelected]}>
                <Text style={[styles.genderText, gender === option && styles.genderTextSelected]}>
                  {option === 'female' ? 'Kadın' : 'Erkek'}
                </Text>
              </Pressable>
            ))}
          </View>
          {!gender ? <Text style={styles.error}>Cinsiyet seçin.</Text> : null}
        </View>

        <View style={styles.section}>
          <LabeledInput label="Yaş" onChangeText={setAge} value={age} keyboardType="number-pad" />
          {ageError ? <Text style={styles.error}>{ageError}</Text> : null}
          <LabeledInput label="Boy (cm)" onChangeText={setHeightCm} value={heightCm} keyboardType="number-pad" />
          {heightError ? <Text style={styles.error}>{heightError}</Text> : null}
          <LabeledInput label="Kilo (kg)" onChangeText={setWeightKg} value={weightKg} keyboardType="decimal-pad" />
          {weightError ? <Text style={styles.error}>{weightError}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Aktivite seviyesi</Text>
          <View style={styles.optionList}>
            {activityOptions.map((option) => (
              <SelectableOption
                key={option.value}
                description={option.description}
                onPress={() => setActivity(option.value)}
                selected={activity === option.value}
                title={option.title}
              />
            ))}
          </View>
          {!activity ? <Text style={styles.error}>Aktivite seviyenizi seçin.</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Hedefiniz</Text>
          <View style={styles.optionList}>
            {goalOptions.map((option) => (
              <SelectableOption
                key={option.value}
                onPress={() => setGoal(option.value)}
                selected={goal === option.value}
                title={option.title}
              />
            ))}
          </View>
          {!goal ? <Text style={styles.error}>Bir hedef seçin.</Text> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!isValid || isSaving}
          onPress={() => void handleSubmit()}
          style={[styles.submitButton, (!isValid || isSaving) && styles.submitButtonDisabled]}>
          <Text style={styles.submitText}>{isSaving ? 'Kaydediliyor...' : 'Hesapla'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, paddingHorizontal: spacing.xl },
  error: { color: colors.danger, fontSize: typography.small, marginTop: spacing.xs },
  eyebrow: { color: colors.accent, fontSize: typography.small, fontWeight: '700', letterSpacing: 1.2 },
  genderButton: { alignItems: 'center', borderRadius: radius.sm, flex: 1, padding: spacing.md },
  genderButtonSelected: { backgroundColor: colors.accent },
  genderGroup: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', padding: spacing.xs },
  genderText: { color: colors.textMuted, fontSize: typography.body, fontWeight: '600' },
  genderTextSelected: { color: colors.background },
  intro: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  keyboardView: { backgroundColor: colors.background, flex: 1 },
  label: { color: colors.text, fontSize: typography.body, fontWeight: '600' },
  optionList: { gap: spacing.sm },
  section: { gap: spacing.sm },
  submitButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, marginTop: spacing.sm, padding: spacing.lg },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { color: colors.background, fontSize: typography.body, fontWeight: '700' },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700', lineHeight: 36 },
});
