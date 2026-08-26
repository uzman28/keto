import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DayLog, LogEntry, UserProfile, WeightEntry } from './types';

const PROFILE_KEY = '@keto/profile';
const FAVORITES_KEY = '@keto/favorites';
const LOG_KEY = '@keto/log';
const WATER_KEY = '@keto/water';
const WEIGHT_KEY = '@keto/weight';

/** Kayıtlar cihazda sınırsız birikmesin diye tutulan en fazla gün sayısı. */
const MAX_LOG_DAYS = 90;

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);
    return savedProfile ? (JSON.parse(savedProfile) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export async function clearProfile(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function getFavorites(): Promise<string[]> {
  try {
    const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!savedFavorites) {
      return [];
    }

    const parsedFavorites: unknown = JSON.parse(savedFavorites);
    return Array.isArray(parsedFavorites)
      ? parsedFavorites.filter((favorite): favorite is string => typeof favorite === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(recipeId: string): Promise<string[]> {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.includes(recipeId)
      ? favorites.filter((id) => id !== recipeId)
      : [...favorites, recipeId];

    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    return updatedFavorites;
  } catch {
    return [];
  }
}

async function readDayLog(): Promise<DayLog> {
  try {
    const savedLog = await AsyncStorage.getItem(LOG_KEY);
    if (!savedLog) {
      return {};
    }

    const parsedLog: unknown = JSON.parse(savedLog);
    return parsedLog && typeof parsedLog === 'object' && !Array.isArray(parsedLog)
      ? (parsedLog as DayLog)
      : {};
  } catch {
    return {};
  }
}

/** Tarih anahtarları sıralanabilir olduğu için en yeni MAX_LOG_DAYS günü tutmak yeterli. */
function pruneDayLog(log: DayLog): DayLog {
  const recentDates = Object.keys(log).sort().slice(-MAX_LOG_DAYS);

  return Object.fromEntries(recentDates.map((dateKey) => [dateKey, log[dateKey]]));
}

async function writeEntries(dateKey: string, entries: LogEntry[]): Promise<LogEntry[]> {
  const log = await readDayLog();
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(pruneDayLog({ ...log, [dateKey]: entries })));

  return entries;
}

export async function getEntriesForDate(dateKey: string): Promise<LogEntry[]> {
  const log = await readDayLog();
  const entries = log[dateKey];

  return Array.isArray(entries) ? entries : [];
}

export async function addLogEntry(dateKey: string, entry: LogEntry): Promise<LogEntry[]> {
  const entries = await getEntriesForDate(dateKey);

  try {
    return await writeEntries(dateKey, [...entries, entry]);
  } catch {
    return entries;
  }
}

export async function removeLogEntry(dateKey: string, entryId: string): Promise<LogEntry[]> {
  const entries = await getEntriesForDate(dateKey);

  try {
    return await writeEntries(
      dateKey,
      entries.filter((entry) => entry.id !== entryId),
    );
  } catch {
    return entries;
  }
}

/** Kayıt kimliği; uuid bağımlılığı eklemeden çakışmayacak kadar ayırt edici. */
export function createEntryId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- Su takibi -------------------------------------------------------------

type WaterLog = Record<string, number>;

async function readWaterLog(): Promise<WaterLog> {
  try {
    const savedLog = await AsyncStorage.getItem(WATER_KEY);
    if (!savedLog) {
      return {};
    }

    const parsedLog: unknown = JSON.parse(savedLog);
    return parsedLog && typeof parsedLog === 'object' && !Array.isArray(parsedLog)
      ? (parsedLog as WaterLog)
      : {};
  } catch {
    return {};
  }
}

export async function getWaterForDate(dateKey: string): Promise<number> {
  const log = await readWaterLog();
  const glasses = log[dateKey];

  return typeof glasses === 'number' && Number.isFinite(glasses) ? Math.max(glasses, 0) : 0;
}

/** delta kadar bardak ekler/çıkarır ve yeni değeri döndürür. Sonuç 0'ın altına inmez. */
export async function changeWaterForDate(dateKey: string, delta: number): Promise<number> {
  const current = await getWaterForDate(dateKey);
  const next = Math.max(current + delta, 0);

  try {
    const log = await readWaterLog();
    const recentDates = Object.keys({ ...log, [dateKey]: next })
      .sort()
      .slice(-MAX_LOG_DAYS);
    const pruned = Object.fromEntries(
      recentDates.map((key) => [key, key === dateKey ? next : log[key]]),
    );

    await AsyncStorage.setItem(WATER_KEY, JSON.stringify(pruned));
    return next;
  } catch {
    return current;
  }
}

// --- Kilo takibi -----------------------------------------------------------

export async function getWeightEntries(): Promise<WeightEntry[]> {
  try {
    const savedEntries = await AsyncStorage.getItem(WEIGHT_KEY);
    if (!savedEntries) {
      return [];
    }

    const parsedEntries: unknown = JSON.parse(savedEntries);
    if (!Array.isArray(parsedEntries)) {
      return [];
    }

    return (parsedEntries as WeightEntry[])
      .filter((entry) => typeof entry?.date === 'string' && Number.isFinite(entry?.weightKg))
      .sort((first, second) => first.date.localeCompare(second.date));
  } catch {
    return [];
  }
}

/** Aynı güne ikinci kez girilirse eski kayıt güncellenir; gün başına tek ölçüm tutuyoruz. */
export async function saveWeightEntry(entry: WeightEntry): Promise<WeightEntry[]> {
  const entries = await getWeightEntries();
  const updated = [...entries.filter((item) => item.date !== entry.date), entry].sort(
    (first, second) => first.date.localeCompare(second.date),
  );

  try {
    await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return entries;
  }
}

export async function removeWeightEntry(dateKey: string): Promise<WeightEntry[]> {
  const entries = await getWeightEntries();
  const updated = entries.filter((entry) => entry.date !== dateKey);

  try {
    await AsyncStorage.setItem(WEIGHT_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return entries;
  }
}
