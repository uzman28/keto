const weekdayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/**
 * Cihazın yerel saatine göre 'YYYY-MM-DD' anahtarı üretir.
 * toISOString() UTC'ye çevirdiği için gece yarısı civarında günü kaydırırdı.
 */
export function getDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** '18 Ağustos, Salı' — Intl'e bağlı kalmamak için elle biçimlendiriyoruz. */
export function formatDayLabel(date: Date = new Date()): string {
  return `${date.getDate()} ${monthNames[date.getMonth()]}, ${weekdayNames[date.getDay()]}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);

  return next;
}

export function isSameDay(first: Date, second: Date): boolean {
  return getDateKey(first) === getDateKey(second);
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
