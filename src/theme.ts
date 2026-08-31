/**
 * Obsidian — High-Contrast Dark
 *
 * "Precision in Darkness": neredeyse siyah zemin, yüksek kontrastlı metin,
 * işlevsel aksan renkleri. Ayrım gölgeyle değil ince çizgiyle yapılır.
 *
 * Renk rollerinin ayrılması bilinçli:
 *   - accent (mor)  → etkileşim: buton, bağlantı, seçili durum, ilerleme
 *   - success/warning/danger → yalnızca anlam taşır (trafik ışığı, hedef aşımı)
 * Aksan rengi dekorasyon için kullanılmaz; her yerde olursa hiçbir yerde olmaz.
 */
export const colors = {
  /** Sayfanın en alt katmanı. */
  background: '#09090b',

  /** Yüzey kademeleri — çok ince artışlar, zinc ailesi. */
  surface: '#0c0c0f',
  surfaceLow: '#0f0f12',
  surfaceContainer: '#121215',
  surfaceHigh: '#18181b',
  surfaceHighest: '#1e1e22',

  /** Ayırıcı çizgiler. Gölge yerine bunlar kullanılır. */
  border: '#27272a',
  borderStrong: '#52525b',

  text: '#fafafa',
  textMuted: '#a1a1aa',
  textFaint: '#71717a',

  /** Mor — etkileşimin rengi. */
  accent: '#a78bfa',
  accentStrong: '#7c3aed',
  accentSoft: '#c4b5fd',
  accentSurface: '#1c1233',

  /** Emerald — olumlu durum, trafik ışığında "serbest". */
  success: '#34d399',
  successSurface: '#052e23',

  /** Amber — trafik ışığında "ölçülü". */
  warning: '#fbbf24',
  warningSurface: '#2e2109',

  /** Kırmızı — yalnızca hata ve hedef aşımı. */
  danger: '#ef4444',
  dangerSurface: '#3b1111',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  small: 13,
  body: 16,
  section: 20,
  heading: 30,
  display: 56,
} as const;

/**
 * Geist ailesi. Ağırlıklar font yüklenirken eşleştiriliyor; RN'de fontWeight
 * yerine doğrudan aile adı verilmesi gerekiyor, aksi halde Android yanlış
 * varyantı seçiyor.
 */
export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  bold: 'Geist_700Bold',
  black: 'Geist_900Black',
} as const;

/**
 * Harf aralığı tasarımın imzası: başlıklar sıkı, etiketler geniş.
 * Bu iki uç arasındaki kontrast, tek başına "tasarlanmış" hissini veriyor.
 */
export const tracking = {
  /** Büyük başlıklar — BÜYÜK HARF ve sıkı. */
  tight: -1.2,
  /** Gövde metni. */
  normal: 0,
  /** Küçük bölüm etiketleri — BÜYÜK HARF ve geniş. */
  wide: 1.6,
} as const;

/** Sık tekrar eden metin biçimleri; her ekranda yeniden yazılmasın diye. */
export const text = {
  /** Ekran başlığı: VITALS, BESİNLER */
  display: {
    color: colors.text,
    fontFamily: fonts.black,
    fontSize: typography.heading,
    letterSpacing: tracking.tight,
    textTransform: 'uppercase',
  },
  /** Başlık altı açıklama: SYSTEM CHECK */
  eyebrow: {
    color: colors.textFaint,
    fontFamily: fonts.medium,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase',
  },
  /** Bölüm etiketi: SON EKLENENLER */
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: typography.small,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: typography.section,
  },
  body: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: typography.body,
  },
  bodyMuted: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.body,
  },
  caption: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: typography.small,
  },
} as const;
