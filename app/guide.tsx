import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FilterChip } from '../src/components/FilterChip';
import { Screen } from '../src/components/Screen';
import { articles } from '../src/data/articles';
import { colors, fonts, radius, spacing, tracking, typography } from '../src/theme';
import type { Article } from '../src/types';

type CategoryFilter = 'all' | Article['category'];

const categoryFilters: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'Tümü', value: 'all' },
  { label: 'Temel', value: 'temel' },
  { label: 'Başlangıç', value: 'baslangic' },
  { label: 'Beslenme', value: 'beslenme' },
  { label: 'Sorun çözme', value: 'sorun-cozme' },
];

const categoryLabels: Record<Article['category'], string> = {
  baslangic: 'BAŞLANGIÇ',
  beslenme: 'BESLENME',
  'sorun-cozme': 'SORUN ÇÖZME',
  temel: 'TEMEL',
};

export default function GuideScreen() {
  const [category, setCategory] = useState<CategoryFilter>('all');

  const filteredArticles = useMemo(
    () => (category === 'all' ? articles : articles.filter((item) => item.category === category)),
    [category],
  );

  return (
    <Screen withBottomInset>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Ionicons color={colors.accent} name="chevron-back" size={20} />
        <Text style={styles.backText}>GERİ</Text>
      </Pressable>

      <View style={styles.heading}>
        <Text style={styles.title}>Rehber</Text>
        <Text style={styles.subtitle}>Keto hakkında bilmen gerekenler, kısa yazılar halinde.</Text>
      </View>

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

      <View style={styles.list}>
        {filteredArticles.map((article) => (
          <Pressable
            key={article.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/article/[id]', params: { id: article.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={styles.cardTopRow}>
              <Text style={styles.category}>{categoryLabels[article.category]}</Text>
              <Text style={styles.readTime}>{article.readMin} dk</Text>
            </View>
            <Text style={styles.cardTitle}>{article.title}</Text>
            <Text style={styles.cardSummary}>{article.summary}</Text>
            <Text style={styles.link}>Oku →</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 2 },
  backText: { color: colors.accent, fontFamily: fonts.bold, fontSize: typography.small, letterSpacing: tracking.wide },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  cardPressed: { opacity: 0.85 },
  cardSummary: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  cardTitle: { color: colors.text, fontSize: typography.section, fontFamily: fonts.bold, lineHeight: 27 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  category: { color: colors.accent, fontSize: typography.small, fontFamily: fonts.black, letterSpacing: 1 },
  chipScrollContent: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl },
  chipScroller: { marginHorizontal: -spacing.xl },
  heading: { gap: spacing.xs },
  link: { color: colors.accent, fontSize: typography.small, fontFamily: fonts.bold, marginTop: spacing.xs },
  list: { gap: spacing.md },
  readTime: { color: colors.textMuted, fontSize: typography.small },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  title: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: typography.heading,
    letterSpacing: tracking.tight,
    textTransform: 'uppercase',
  },
});
