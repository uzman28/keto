import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '../../src/components/FilterChip';
import { Screen } from '../../src/components/Screen';
import { formatDayLabel } from '../../src/date';
import { useDay } from '../../src/day-context';
import { recipes } from '../../src/data/recipes';
import { scaleMacros } from '../../src/macros';
import { addLogEntry, createEntryId, getFavorites, toggleFavorite } from '../../src/storage';
import { colors, radius, spacing, typography } from '../../src/theme';
import type { MealType } from '../../src/types';

const servingOptions = [0.5, 1, 1.5, 2];

const mealLabels: Record<MealType, string> = {
  aksam: 'AKŞAM YEMEĞİ',
  atistirmalik: 'ATIŞTIRMALIK',
  kahvalti: 'KAHVALTI',
  ogle: 'ÖĞLE YEMEĞİ',
  tatli: 'TATLI',
};

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isViewingToday, selectedDate, selectedDateKey } = useDay();
  const recipe = recipes.find((item) => item.id === id);
  const [isFavorite, setIsFavorite] = useState(false);
  const [servings, setServings] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function loadFavorite() {
      const favorites = await getFavorites();
      setIsFavorite(favorites.includes(id));
    }

    void loadFavorite();
  }, [id]);

  useEffect(() => () => {
    if (addedTimer.current) {
      clearTimeout(addedTimer.current);
    }
  }, []);

  if (!recipe) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Tarif bulunamadı</Text>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Geri dön</Text>
        </Pressable>
      </View>
    );
  }

  async function handleFavorite() {
    const favorites = await toggleFavorite(id);
    setIsFavorite(favorites.includes(id));
  }

  async function handleAddToDay() {
    if (!recipe) {
      return;
    }

    await addLogEntry(selectedDateKey, {
      id: createEntryId(),
      title: recipe.title,
      recipeId: recipe.id,
      mealType: recipe.mealType,
      servings,
      macros: scaleMacros(recipe.macrosPerServing, servings),
      createdAt: new Date().toISOString(),
    });

    setJustAdded(true);

    if (addedTimer.current) {
      clearTimeout(addedTimer.current);
    }
    addedTimer.current = setTimeout(() => setJustAdded(false), 2500);
  }

  const { macrosPerServing } = recipe;
  const scaledMacros = scaleMacros(macrosPerServing, servings);

  return (
    <Screen contentStyle={styles.content} withBottomInset>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Geri</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          accessibilityRole="button"
          hitSlop={spacing.sm}
          onPress={() => void handleFavorite()}
          style={({ pressed }) => pressed && styles.pressed}>
          <Ionicons
            color={isFavorite ? colors.accent : colors.textMuted}
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={26}
          />
        </Pressable>
      </View>

      <Image
        accessibilityLabel={`${recipe.title} görseli`}
        resizeMode="cover"
        source={recipe.image}
        style={styles.image}
      />

      <View style={styles.headingGroup}>
        <Text style={styles.eyebrow}>{mealLabels[recipe.mealType]}</Text>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>
          {recipe.prepMin} dk hazırlık · {recipe.servings} porsiyon
        </Text>
      </View>

      <View style={styles.macroRow}>
        <MacroPill label="Kalori" value={`${macrosPerServing.kcal}`} unit="kcal" />
        <MacroPill label="Yağ" value={`${macrosPerServing.fatG}`} unit="g" />
        <MacroPill label="Protein" value={`${macrosPerServing.proteinG}`} unit="g" />
        <MacroPill highlighted label="Net karb." value={`${macrosPerServing.netCarbG}`} unit="g" />
      </View>
      <Text style={styles.macroNote}>Değerler porsiyon başınadır.</Text>

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>
          {isViewingToday ? 'Bugüne ekle' : `${formatDayLabel(selectedDate)} gününe ekle`}
        </Text>
        <View style={styles.servingRow}>
          {servingOptions.map((option) => (
            <FilterChip
              key={option}
              label={`${option} porsiyon`}
              onPress={() => setServings(option)}
              selected={servings === option}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleAddToDay()}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Text style={styles.addButtonText}>
            {justAdded
              ? 'Eklendi ✓'
              : `${isViewingToday ? 'Bugüne' : 'Seçili güne'} ekle · ${scaledMacros.kcal} kcal`}
          </Text>
        </Pressable>
        <Text style={styles.addNote}>
          {scaledMacros.fatG} g yağ · {scaledMacros.proteinG} g protein ·{' '}
          {scaledMacros.netCarbG} g net karbonhidrat
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Malzemeler</Text>
        <View style={styles.ingredientList}>
          {recipe.ingredients.map((ingredient, index) => (
            <View
              key={ingredient.name}
              style={[styles.ingredientRow, index > 0 && styles.ingredientRowDivider]}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientAmount}>
                {ingredient.amount} {ingredient.unit}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yapılışı</Text>
        <View style={styles.stepList}>
          {recipe.steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {recipe.tips ? (
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>PÜF NOKTASI</Text>
          <Text style={styles.tipText}>{recipe.tips}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

function MacroPill({
  highlighted = false,
  label,
  unit,
  value,
}: {
  highlighted?: boolean;
  label: string;
  unit: string;
  value: string;
}) {
  return (
    <View style={[styles.macroPill, highlighted && styles.macroPillHighlighted]}>
      <Text style={[styles.macroValue, highlighted && styles.macroTextHighlighted]}>{value}</Text>
      <Text style={[styles.macroUnit, highlighted && styles.macroTextHighlighted]}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.sm, padding: spacing.md },
  addButtonText: { color: colors.background, fontSize: typography.body, fontWeight: '700' },
  addCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  addNote: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
  addTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  backText: { color: colors.accent, fontSize: typography.body, fontWeight: '700' },
  content: { gap: spacing.lg },
  emptyState: { alignItems: 'center', backgroundColor: colors.background, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  eyebrow: { color: colors.accent, fontSize: typography.small, fontWeight: '800', letterSpacing: 1 },
  headingGroup: { gap: spacing.xs },
  image: { borderRadius: radius.md, height: 210, width: '100%' },
  ingredientAmount: { color: colors.accent, fontSize: typography.body, fontWeight: '700' },
  ingredientList: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  ingredientName: { color: colors.text, flex: 1, fontSize: typography.body },
  ingredientRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  ingredientRowDivider: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
  macroLabel: { color: colors.textMuted, fontSize: typography.small, marginTop: spacing.xs, textAlign: 'center' },
  macroNote: { color: colors.textMuted, fontSize: typography.small, marginTop: -spacing.sm },
  macroPill: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, flex: 1, paddingHorizontal: spacing.xs, paddingVertical: spacing.md },
  macroPillHighlighted: { backgroundColor: colors.accentSurface, borderColor: colors.accent },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  macroTextHighlighted: { color: colors.accent },
  macroUnit: { color: colors.textMuted, fontSize: typography.small },
  macroValue: { color: colors.text, fontSize: typography.section, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: typography.body },
  pressed: { opacity: 0.6 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.section, fontWeight: '700' },
  servingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stepList: { gap: spacing.md },
  stepNumber: { alignItems: 'center', backgroundColor: colors.accentSurface, borderRadius: radius.pill, height: 28, justifyContent: 'center', width: 28 },
  stepNumberText: { color: colors.accent, fontSize: typography.small, fontWeight: '800' },
  stepRow: { flexDirection: 'row', gap: spacing.md },
  stepText: { color: colors.text, flex: 1, fontSize: typography.body, lineHeight: 24 },
  tipCard: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  tipLabel: { color: colors.accent, fontSize: typography.small, fontWeight: '800', letterSpacing: 1 },
  tipText: { color: colors.text, fontSize: typography.body, lineHeight: 24 },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700', lineHeight: 36 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
