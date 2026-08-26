import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LabeledInput } from '../src/components/LabeledInput';
import { RemoteFoodRow } from '../src/components/RemoteFoodRow';
import { formatDayLabel } from '../src/date';
import { useDay } from '../src/day-context';
import { isRemoteSearchEnabled, searchRemoteFoods } from '../src/food-remote';
import type { RemoteFood, RemoteFoodResult } from '../src/food-remote';
import { macrosForGrams } from '../src/macros';
import { addLogEntry, createEntryId } from '../src/storage';
import { colors, radius, spacing, typography } from '../src/theme';

/** Her tuşta ağ isteği atmamak için — yazmayı bırakınca aranıyor. */
const REMOTE_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

type Tab = 'search' | 'manual';

export default function AddEntryScreen() {
  const { isViewingToday, selectedDate, selectedDateKey } = useDay();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('search');

  const dayLabel = isViewingToday
    ? 'Bugüne eklenecek'
    : `${formatDayLabel(selectedDate)} gününe eklenecek`;

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboardView}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headingGroup}>
            <Text style={styles.title}>Yiyecek ekle</Text>
            <Text style={styles.dayTag}>{dayLabel}</Text>
          </View>
          <Pressable
            accessibilityLabel="Kapat"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Ionicons color={colors.text} name="close" size={22} />
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          {(
            [
              { label: 'Ara', value: 'search' },
              { label: 'Elle gir', value: 'manual' },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === option.value }}
              onPress={() => setTab(option.value)}
              style={[styles.tab, tab === option.value && styles.tabSelected]}>
              <Text style={[styles.tabText, tab === option.value && styles.tabTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'search' ? (
        <SearchTab bottomInset={insets.bottom} dateKey={selectedDateKey} />
      ) : (
        <ManualTab bottomInset={insets.bottom} dateKey={selectedDateKey} />
      )}
    </KeyboardAvoidingView>
  );
}

function SearchTab({ bottomInset, dateKey }: { bottomInset: number; dateKey: string }) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [remoteResults, setRemoteResults] = useState<RemoteFoodResult[]>([]);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const remoteRequest = useRef<AbortController | null>(null);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    remoteRequest.current?.abort();

    if (!isSearching || !isRemoteSearchEnabled()) {
      setRemoteResults([]);
      setRemoteError(null);
      setIsRemoteLoading(false);
      return;
    }

    const controller = new AbortController();
    remoteRequest.current = controller;
    setIsRemoteLoading(true);
    setRemoteError(null);

    const timer = setTimeout(() => {
      searchRemoteFoods(trimmedQuery, controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) {
            setRemoteResults(found);
          }
        })
        .catch((cause: unknown) => {
          if (controller.signal.aborted) {
            return;
          }
          setRemoteResults([]);
          setRemoteError(cause instanceof Error ? cause.message : 'Servise ulaşılamadı.');
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsRemoteLoading(false);
          }
        });
    }, REMOTE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isSearching, trimmedQuery]);

  async function saveEntry(entry: {
    title: string;
    foodId: string;
    grams: number;
    macros: ReturnType<typeof macrosForGrams>;
  }) {
    const entryId = createEntryId();
    const saved = await addLogEntry(dateKey, {
      id: entryId,
      createdAt: new Date().toISOString(),
      ...entry,
    });

    if (!saved.some((item) => item.id === entryId)) {
      Alert.alert('Kaydedilemedi', 'Kayıt eklenemedi. Lütfen yeniden deneyin.');
      return;
    }

    router.back();
  }

  async function handleRemoteAdd(food: RemoteFood, grams: number) {
    await saveEntry({
      // Uzak kayıtları yerel id'lerden ayırmak için ön ek — çakışma olmasın.
      foodId: `fs:${food.id}`,
      title: food.brand ? `${food.name} (${food.brand})` : food.name,
      grams,
      macros: macrosForGrams(food.per100g, grams),
    });
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.xxl }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.searchField}>
        <Ionicons color={colors.textMuted} name="search" size={18} />
        <TextInput
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Yiyecek ara"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Aramayı temizle"
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={() => setQuery('')}>
            <Ionicons color={colors.textMuted} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>

      {!isSearching ? (
        <View style={styles.hintCard}>
          <Ionicons color={colors.textMuted} name="search-outline" size={26} />
          <Text style={styles.hintTitle}>Ne yedin?</Text>
          <Text style={styles.hintText}>
            En az {MIN_QUERY_LENGTH} harf yaz. Yiyecek adlarını İngilizce aramalısın —
            örneğin "egg", "cheese", "chicken".
          </Text>
        </View>
      ) : isRemoteLoading ? (
        <View style={styles.hintCard}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={styles.hintText}>Aranıyor…</Text>
        </View>
      ) : remoteError ? (
        <View style={styles.hintCard}>
          <Ionicons color={colors.warning} name="cloud-offline-outline" size={26} />
          <Text style={styles.hintTitle}>Bağlanılamadı</Text>
          <Text style={styles.hintText}>{remoteError}</Text>
          <Text style={styles.hintText}>
            İnternet olmadan arama yapılamıyor. "Elle gir" sekmesinden değerleri kendin
            girebilirsin.
          </Text>
        </View>
      ) : remoteResults.length === 0 ? (
        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Sonuç yok</Text>
          <Text style={styles.hintText}>
            "{trimmedQuery}" için bir şey bulunamadı. Farklı bir ad dene ya da "Elle gir"
            sekmesinden değerleri kendin gir.
          </Text>
        </View>
      ) : (
        <View style={styles.resultList}>
          {remoteResults.map((result) => (
            <RemoteFoodRow
              key={result.id}
              isExpanded={expandedId === result.id}
              onAdd={(food, grams) => void handleRemoteAdd(food, grams)}
              onToggle={() => setExpandedId(expandedId === result.id ? null : result.id)}
              result={result}
            />
          ))}
        </View>
      )}

    </ScrollView>
  );
}

/** Boş bırakılan makro alanı 0 sayılır; sadece geçersiz sayı girilirse hata verir. */
function macroError(value: string, label: string, max: number): string | null {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(value.replace(',', '.'));

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return `${label} geçerli bir sayı olmalı.`;
  }

  return parsedValue > max ? `${label} en fazla ${max} olabilir.` : null;
}

function toNumber(value: string): number {
  return value.trim() ? Math.round(Number(value.replace(',', '.'))) : 0;
}

function ManualTab({ bottomInset, dateKey }: { bottomInset: number; dateKey: string }) {
  const [title, setTitle] = useState('');
  const [kcal, setKcal] = useState('');
  const [fatG, setFatG] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [netCarbG, setNetCarbG] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const titleError = title.trim().length === 0 ? 'Bir ad yazın.' : null;
  const kcalError = !kcal.trim() ? 'Kalori girin.' : macroError(kcal, 'Kalori', 5000);
  const fatError = macroError(fatG, 'Yağ', 500);
  const proteinError = macroError(proteinG, 'Protein', 500);
  const netCarbError = macroError(netCarbG, 'Net karbonhidrat', 500);
  const isValid = !titleError && !kcalError && !fatError && !proteinError && !netCarbError;

  async function handleSubmit() {
    if (!isValid) {
      return;
    }

    setIsSaving(true);
    const entryId = createEntryId();
    const saved = await addLogEntry(dateKey, {
      id: entryId,
      title: title.trim(),
      macros: {
        kcal: toNumber(kcal),
        fatG: toNumber(fatG),
        proteinG: toNumber(proteinG),
        netCarbG: toNumber(netCarbG),
      },
      createdAt: new Date().toISOString(),
    });
    setIsSaving(false);

    // addLogEntry yazma hatasında eski listeyi döndürüyor; kaydın girdiğini doğruluyoruz.
    if (!saved.some((entry) => entry.id === entryId)) {
      Alert.alert('Kaydedilemedi', 'Kayıt eklenemedi. Lütfen yeniden deneyin.');
      return;
    }

    router.back();
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.xxl }]}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>
        Listede olmayan bir yiyeceği kendin girebilirsin. Değerleri paketin besin tablosundan ya
        da tükettiğin porsiyona göre yaz.
      </Text>

      <View style={styles.section}>
        <LabeledInput
          label="Ne yedin?"
          onChangeText={setTitle}
          placeholder="Örn. 2 haşlanmış yumurta"
          value={title}
        />
        {titleError && title.length > 0 ? <Text style={styles.error}>{titleError}</Text> : null}

        <LabeledInput keyboardType="number-pad" label="Kalori (kcal)" onChangeText={setKcal} value={kcal} />
        {kcalError && kcal.length > 0 ? <Text style={styles.error}>{kcalError}</Text> : null}

        <LabeledInput keyboardType="decimal-pad" label="Yağ (g)" onChangeText={setFatG} value={fatG} />
        {fatError ? <Text style={styles.error}>{fatError}</Text> : null}

        <LabeledInput keyboardType="decimal-pad" label="Protein (g)" onChangeText={setProteinG} value={proteinG} />
        {proteinError ? <Text style={styles.error}>{proteinError}</Text> : null}

        <LabeledInput
          keyboardType="decimal-pad"
          label="Net karbonhidrat (g)"
          onChangeText={setNetCarbG}
          value={netCarbG}
        />
        {netCarbError ? <Text style={styles.error}>{netCarbError}</Text> : null}

        <Text style={styles.hint}>Boş bıraktığın makrolar 0 olarak kaydedilir.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!isValid || isSaving}
        onPress={() => void handleSubmit()}
        style={[styles.submitButton, (!isValid || isSaving) && styles.submitButtonDisabled]}>
        <Text style={styles.submitText}>{isSaving ? 'Kaydediliyor...' : 'Güne ekle'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  closeButton: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.pill, height: 36, justifyContent: 'center', width: 36 },
  content: { gap: spacing.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  dayTag: { color: colors.accent, fontSize: typography.small, fontWeight: '700' },
  error: { color: colors.danger, fontSize: typography.small, marginTop: -spacing.xs },
  header: { backgroundColor: colors.background, gap: spacing.lg, paddingBottom: spacing.md, paddingHorizontal: spacing.xl },
  headerTop: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headingGroup: { gap: spacing.xs },
  hint: { color: colors.textMuted, fontSize: typography.small },
  hintCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderStyle: 'dashed', borderWidth: 1, gap: spacing.sm, padding: spacing.xl },
  hintText: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
  hintTitle: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  intro: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  keyboardView: { backgroundColor: colors.background, flex: 1 },
  pressed: { opacity: 0.8 },
  resultList: { gap: spacing.sm },
  searchField: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  searchInput: { color: colors.text, flex: 1, fontSize: typography.body, padding: 0 },
  section: { gap: spacing.md },
  submitButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.lg },
  submitButtonDisabled: { opacity: 0.4 },
  submitText: { color: colors.background, fontSize: typography.body, fontWeight: '700' },
  tab: { alignItems: 'center', borderRadius: radius.sm, flex: 1, paddingVertical: spacing.sm },
  tabBar: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', padding: spacing.xs },
  tabSelected: { backgroundColor: colors.surfaceElevated },
  tabText: { color: colors.textMuted, fontSize: typography.body, fontWeight: '700' },
  tabTextSelected: { color: colors.text },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
});
