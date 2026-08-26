import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { getDateKey, isToday } from './date';

interface DayContextValue {
  /** Ana sayfada gezilen gün. Ekleme yapan tüm ekranlar bu güne yazar. */
  selectedDate: Date;
  selectedDateKey: string;
  isViewingToday: boolean;
  setSelectedDate: (date: Date) => void;
  goToToday: () => void;
}

const DayContext = createContext<DayContextValue | null>(null);

/**
 * Seçili gün ekranlar arasında paylaşılıyor; aksi halde tarif detayı gibi
 * ekranlar kendi başına "bugün" varsayar ve geçmiş güne bakarken yanlış güne
 * kayıt açılır.
 */
export function DayProvider({ children }: PropsWithChildren) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const goToToday = useCallback(() => setSelectedDate(new Date()), []);

  const value = useMemo(
    () => ({
      selectedDate,
      selectedDateKey: getDateKey(selectedDate),
      isViewingToday: isToday(selectedDate),
      setSelectedDate,
      goToToday,
    }),
    [goToToday, selectedDate],
  );

  return <DayContext.Provider value={value}>{children}</DayContext.Provider>;
}

export function useDay(): DayContextValue {
  const context = useContext(DayContext);

  if (!context) {
    throw new Error('useDay must be used inside DayProvider');
  }

  return context;
}
