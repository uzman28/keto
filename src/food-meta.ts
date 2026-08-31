import { colors } from './theme';
import type { FoodCategory, FoodVerdict } from './types';

interface VerdictStyle {
  label: string;
  shortLabel: string;
  color: string;
  surface: string;
  /** Rozeti renk körlüğünde de ayırt edilebilir kılmak için. */
  icon: 'checkmark-circle' | 'alert-circle' | 'close-circle';
}

export const verdictStyles: Record<FoodVerdict, VerdictStyle> = {
  serbest: {
    label: 'Serbest',
    shortLabel: 'Serbest',
    color: colors.success,
    surface: colors.successSurface,
    icon: 'checkmark-circle',
  },
  olculu: {
    label: 'Ölçülü tüket',
    shortLabel: 'Ölçülü',
    color: colors.warning,
    surface: colors.warningSurface,
    icon: 'alert-circle',
  },
  kacin: {
    label: 'Kaçın',
    shortLabel: 'Kaçın',
    color: colors.danger,
    surface: colors.dangerSurface,
    icon: 'close-circle',
  },
};

export const categoryLabels: Record<FoodCategory, string> = {
  baklagil: 'Baklagil',
  icecek: 'İçecek',
  kuruyemis: 'Kuruyemiş',
  meyve: 'Meyve',
  protein: 'Et, balık, yumurta',
  sebze: 'Sebze',
  sut: 'Süt ürünü',
  tahil: 'Tahıl',
  tatli: 'Tatlı ve sos',
  yag: 'Yağ',
};

export const verdictOrder: FoodVerdict[] = ['serbest', 'olculu', 'kacin'];
