import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../src/components/Screen';
import { articles } from '../../src/data/articles';
import { colors, radius, spacing, typography } from '../../src/theme';

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = articles.find((item) => item.id === id);

  if (!article) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Makale bulunamadı</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Geri dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Screen contentStyle={styles.content} withBottomInset>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>‹ Geri</Text>
      </Pressable>
      <Text style={styles.category}>{article.category.toUpperCase()}</Text>
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.readTime}>{article.readMin} dk okuma</Text>

      <View style={styles.body}>
        {article.body.split('\n\n').map((section) =>
          section.startsWith('## ') ? (
            <Text key={section} style={styles.subtitle}>{section.slice(3)}</Text>
          ) : (
            <Text key={section} style={styles.paragraph}>{section}</Text>
          ),
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  backText: { color: colors.accent, fontSize: typography.body, fontWeight: '700' },
  body: { gap: spacing.md, marginTop: spacing.lg },
  category: { color: colors.accent, fontSize: typography.small, fontWeight: '700', letterSpacing: 1, marginTop: spacing.md },
  // Bu ekranda boşluklar tek tek marginTop ile veriliyor, Screen'in varsayılan gap'ini kapatıyoruz.
  content: { gap: 0 },
  emptyState: { alignItems: 'center', backgroundColor: colors.background, flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  paragraph: { color: colors.text, fontSize: typography.body, lineHeight: 25 },
  readTime: { color: colors.textMuted, fontSize: typography.small, marginTop: spacing.sm },
  subtitle: { color: colors.text, fontSize: typography.section, fontWeight: '700', marginTop: spacing.md },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700', lineHeight: 37, marginTop: spacing.sm },
});
