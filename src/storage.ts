import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DayLog, LogEntry, UserProfile } from './types';

const PROFILE_KEY = '@keto/profile';
const FAVORITES_KEY = '@keto/favorites';
const LOG_KEY = '@keto/log';

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
