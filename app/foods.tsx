import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '../src/components/FilterChip';
import { FoodRow } from '../src/components/FoodRow';
import { Screen } from '../src/components/Screen';
import { foods } from '../src/data/foods';
import { categoryLabels, verdictOrder, verdictStyles } from '../src/food-meta';
import { colors, radius, spacing, typography } from '../src/theme';
import type { FoodCategory, FoodVerdict } from '../src/types';

type VerdictFilter = 'all' | FoodVerdict;
type CategoryFilter = 'all' | FoodCategory;

const verdictFilters: Array<{ label: string; value: VerdictFilter }> = [
  { label: 'Tümü', value: 'all' },
  ...verdictOrder.map((verdict) => ({
    label: verdictStyles[verdict].shortLabel,
    value: verdict as VerdictFilter,
  })),
];

/** Sadece veri setinde geçen kategoriler; boş filtre göstermemek için. */
const usedCategories = Array.from(new Set(foods.map((food) => food.category))).sort((a, b) =>
  categoryLabels[a].localeCompare(categoryLabels[b], 'tr'),
);

const categoryFilters: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'Tümü', value: 'all' },
  ...usedCategories.map((category) => ({
    label: categoryLabels[category],
    value: category as CategoryFilter,
  })),
];

export default function FoodsScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [verdict, setVerdict] = useState<VerdictFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');
  // Ana sayfadaki vitrinden gelindiyse o besin açık başlasın.
  const [expandedId, setExpandedId] = useState<string | null>(focus ?? null);

  const filteredFoods = useMemo(
    () =>
      foods.filter(
        (food) =>
          (verdict === 'all' || food.verdict === verdict) &&
          (category === 'all' || food.category === category),
      ),
    [category, verdict],
  );

  const grouped = useMemo(
    () =>
      verdictOrder
        .map((group) => ({
          verdict: group,
          items: filteredFoods.filter((food) => food.verdict === group),
        }))
        .filter((group) => group.items.length > 0),
    [filteredFoods],
  );

  return (
    <Screen withBottomInset>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>‹ Geri</Text>
      </Pressable>

      <View style={styles.headingGroup}>
        <Text style={styles.title}>Besinler</Text>
        <Text style={styles.subtitle}>
          Hangi besin ketoya uyar, hangisi hedefi zorlar? Ayrıntı için besinin üzerine dokun.
        </Text>
      </View>

      <View style={styles.legend}>
        {verdictOrder.map((group) => (
          <View key={group} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: verdictStyles[group].color }]} />
            <Text style={styles.legendText}>{verdictStyles[group].label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Değerlendirme</Text>
        <View style={styles.chipRow}>
          {verdictFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              onPress={() => setVerdict(filter.value)}
              selected={verdict === filter.value}
            />
          ))}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Kategori</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
          style={styles.chipScroller}>
          {categoryFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              onPress={() => setCategory(filter.value)}
              selected={category === filter.value}
            />
          ))}
        </ScrollView>
      </View>

      {grouped.length === 0 ? (
        <Text style={styles.emptyText}>Bu filtreye uygun besin yok.</Text>
      ) : (
        grouped.map((group) => (
          <View key={group.verdict} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: verdictStyles[group.verdict].color }]}>
              {verdictStyles[group.verdict].label} · {group.items.length}
            </Text>
            <View style={styles.list}>
              {group.items.map((food) => (
                <FoodRow
                  key={food.id}
                  food={food}
                  isExpanded={expandedId === food.id}
                  onToggle={() => setExpandedId(expandedId === food.id ? null : food.id)}
                />
              ))}
            </View>
          </View>
        ))
      )}

      <Text style={styles.footnote}>
        Değerler 100 gram (içeceklerde 100 ml) için yaklaşık ortalamalardır. Marka, olgunluk,
        pişirme ve porsiyona göre değişir; kesin hesap için ürünün kendi besin tablosuna bakın.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  backText: { color: colors.accent, fontSize: typography.body, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipScrollContent: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  chipScroller: { marginHorizontal: -spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
  filterGroup: { gap: spacing.sm },
  filterLabel: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  footnote: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  headingGroup: { gap: spacing.xs },
  legend: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  legendDot: { borderRadius: radius.pill, height: 10, width: 10 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  legendText: { color: colors.text, fontSize: typography.small },
  list: { gap: spacing.sm },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: typography.section, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
});
