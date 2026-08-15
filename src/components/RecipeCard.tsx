import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import type { MealType, Recipe } from '../types';

interface RecipeCardProps {
  isFavorite: boolean;
  onFavoritePress: () => void;
  onPress: () => void;
  recipe: Recipe;
}

const mealLabels: Record<MealType, string> = {
  aksam: 'AKŞAM YEMEĞİ',
  atistirmalik: 'ATIŞTIRMALIK',
  kahvalti: 'KAHVALTI',
  ogle: 'ÖĞLE YEMEĞİ',
  tatli: 'TATLI',
};

const mealIcons: Record<MealType, 'cafe-outline' | 'fish-outline' | 'leaf-outline' | 'restaurant-outline' | 'sparkles-outline'> = {
  aksam: 'restaurant-outline',
  atistirmalik: 'leaf-outline',
  kahvalti: 'cafe-outline',
  ogle: 'restaurant-outline',
  tatli: 'sparkles-outline',
};

export function RecipeCard({ isFavorite, onFavoritePress, onPress, recipe }: RecipeCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${recipe.title} tarifini aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.imageContainer}>
        <Image
          accessibilityLabel={`${recipe.title} görseli`}
          resizeMode="cover"
          source={recipe.image}
          style={styles.image}
        />
        {/* Açık renkli yemek fotoğraflarında üstteki beyaz yazının okunabilmesi için koyu perde. */}
        <View pointerEvents="none" style={styles.scrim} />
        <View pointerEvents="none" style={styles.imageContent}>
          <View style={styles.iconCircle}>
            <Ionicons color={colors.text} name={mealIcons[recipe.mealType]} size={30} />
          </View>
          <Text style={styles.mealLabel}>{mealLabels[recipe.mealType]}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={2} style={styles.title}>{recipe.title}</Text>
          <Pressable
            accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={onFavoritePress}
            style={({ pressed }) => pressed && styles.heartPressed}>
            <Ionicons
              color={isFavorite ? colors.accent : colors.textMuted}
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
            />
          </Pressable>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{recipe.prepMin} dk</Text>
          <Text style={styles.meta}>{recipe.servings} porsiyon</Text>
          <View style={styles.carbBadge}>
            <Text style={styles.carbText}>{recipe.macrosPerServing.netCarbG} g net karbonhidrat</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm, padding: spacing.lg },
  carbBadge: { backgroundColor: colors.accentSurface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  carbText: { color: colors.accent, fontSize: typography.small, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  cardPressed: { opacity: 0.85 },
  heartPressed: { opacity: 0.6 },
  iconCircle: { alignItems: 'center', backgroundColor: colors.accentSurface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, height: 54, justifyContent: 'center', width: 54 },
  image: { height: '100%', width: '100%' },
  imageContainer: { height: 168, position: 'relative' },
  imageContent: { alignItems: 'flex-start', bottom: spacing.lg, left: spacing.lg, position: 'absolute' },
  mealLabel: { color: colors.text, fontSize: typography.small, fontWeight: '800', letterSpacing: 1, marginTop: spacing.sm },
  meta: { color: colors.textMuted, fontSize: typography.small },
  metaRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  scrim: { backgroundColor: 'rgba(0, 0, 0, 0.35)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  title: { color: colors.text, flex: 1, fontSize: typography.section, fontWeight: '700', lineHeight: 26 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
});
