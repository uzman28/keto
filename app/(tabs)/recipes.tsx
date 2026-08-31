import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '../../src/components/FilterChip';
import { RecipeCard } from '../../src/components/RecipeCard';
import { Screen } from '../../src/components/Screen';
import { recipes } from '../../src/data/recipes';
import { getFavorites, toggleFavorite } from '../../src/storage';
import { colors, fonts, spacing, tracking, typography } from '../../src/theme';
import type { MealType } from '../../src/types';

type CarbFilter = 'all' | 'under-10' | 'under-5';
type MealFilter = 'all' | MealType;

const mealFilters: Array<{ label: string; value: MealFilter }> = [
  { label: 'Tümü', value: 'all' },
  { label: 'Kahvaltı', value: 'kahvalti' },
  { label: 'Öğle', value: 'ogle' },
  { label: 'Akşam', value: 'aksam' },
  { label: 'Atıştırmalık', value: 'atistirmalik' },
  { label: 'Tatlı', value: 'tatli' },
];

const carbFilters: Array<{ label: string; value: CarbFilter }> = [
  { label: 'Tümü', value: 'all' },
  { label: '<5 g', value: 'under-5' },
  { label: '<10 g', value: 'under-10' },
];

function matchesCarbFilter(netCarbG: number, filter: CarbFilter): boolean {
  if (filter === 'under-5') {
    return netCarbG < 5;
  }
  return filter === 'under-10' ? netCarbG < 10 : true;
}

export default function RecipesScreen() {
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [carbFilter, setCarbFilter] = useState<CarbFilter>('all');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Detay ekranında favori değiştirilip geri dönülebildiği için her odaklanmada yeniden okuyoruz.
  useFocusEffect(
    useCallback(() => {
      async function loadFavorites() {
        setFavoriteIds(await getFavorites());
      }

      void loadFavorites();
    }, []),
  );

  const filteredRecipes = useMemo(
    () =>
      recipes.filter(
        (recipe) =>
          (mealFilter === 'all' || recipe.mealType === mealFilter) &&
          matchesCarbFilter(recipe.macrosPerServing.netCarbG, carbFilter),
      ),
    [carbFilter, mealFilter],
  );
  const favoriteRecipes = filteredRecipes.filter((recipe) => favoriteIds.includes(recipe.id));
  const otherRecipes = filteredRecipes.filter((recipe) => !favoriteIds.includes(recipe.id));

  async function handleFavorite(recipeId: string) {
    setFavoriteIds(await toggleFavorite(recipeId));
  }

  return (
    <Screen>
      <Text style={styles.title}>Tarifler</Text>

      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Öğün</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
          style={styles.chipScroller}>
          {mealFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              onPress={() => setMealFilter(filter.value)}
              selected={mealFilter === filter.value}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Net karbonhidrat</Text>
        <View style={styles.chipRow}>
          {carbFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              onPress={() => setCarbFilter(filter.value)}
              selected={carbFilter === filter.value}
            />
          ))}
        </View>
      </View>

      {filteredRecipes.length === 0 ? (
        <Text style={styles.emptyText}>Bu filtreye uygun tarif yok.</Text>
      ) : (
        <View style={styles.recipeSections}>
          {favoriteRecipes.length > 0 ? (
            <RecipeSection
              favoriteIds={favoriteIds}
              onFavoritePress={handleFavorite}
              recipes={favoriteRecipes}
              title="Favoriler"
            />
          ) : null}
          <RecipeSection
            favoriteIds={favoriteIds}
            onFavoritePress={handleFavorite}
            recipes={otherRecipes}
            title={favoriteRecipes.length > 0 ? 'Diğer tarifler' : 'Tüm tarifler'}
          />
        </View>
      )}
    </Screen>
  );
}

function RecipeSection({
  favoriteIds,
  onFavoritePress,
  recipes: sectionRecipes,
  title,
}: {
  favoriteIds: string[];
  onFavoritePress: (recipeId: string) => void;
  recipes: typeof recipes;
  title: string;
}) {
  if (sectionRecipes.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sectionRecipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          isFavorite={favoriteIds.includes(recipe.id)}
          onFavoritePress={() => void onFavoritePress(recipe.id)}
          onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
          recipe={recipe}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  // Yatay çip listesi ekranın kenarına kadar kaysın diye sayfa boşluğunu iptal edip kendi içinde veriyoruz.
  chipScrollContent: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  chipScroller: { marginHorizontal: -spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
  filterGroup: { gap: spacing.sm },
  filterLabel: { color: colors.text, fontSize: typography.body, fontFamily: fonts.bold },
  recipeSections: { gap: spacing.xl },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.section, fontFamily: fonts.bold },
  title: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: typography.heading,
    letterSpacing: tracking.tight,
    textTransform: 'uppercase',
  },
});
