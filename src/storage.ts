import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserProfile } from './types';

const PROFILE_KEY = '@keto/profile';
const FAVORITES_KEY = '@keto/favorites';

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
