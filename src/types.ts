import type { ImageSourcePropType } from 'react-native';

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  createdAt: string;
}

export interface MacroTargets {
  calories: number;
  fatG: number;
  proteinG: number;
  netCarbG: number;
  bmr: number;
  tdee: number;
}

export type MealType = 'kahvalti' | 'ogle' | 'aksam' | 'atistirmalik' | 'tatli';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface FoodMacros {
  kcal: number;
  fatG: number;
  proteinG: number;
  netCarbG: number;
}

export interface Recipe {
  id: string;
  title: string;
  image: ImageSourcePropType;
  mealType: MealType;
  prepMin: number;
  servings: number;
  macrosPerServing: FoodMacros;
  ingredients: Ingredient[];
  steps: string[];
  tips?: string;
}

/** Güne eklenmiş tek bir öğün kaydı. macros porsiyonla çarpılmış toplamı tutar. */
export interface LogEntry {
  id: string;
  title: string;
  recipeId: string;
  mealType: MealType;
  servings: number;
  macros: FoodMacros;
  createdAt: string;
}

/** Tarih anahtarı ('2026-08-18') -> o günün kayıtları. */
export type DayLog = Record<string, LogEntry[]>;

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: 'temel' | 'baslangic' | 'sorun-cozme' | 'beslenme';
  readMin: number;
  body: string;
}
