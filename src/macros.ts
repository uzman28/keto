import type {
  ActivityLevel,
  FoodMacros,
  Gender,
  Goal,
  LogEntry,
  MacroTargets,
  UserProfile,
} from './types';

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

const goalAdjustments: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

const calorieMinimums: Record<Gender, number> = {
  male: 1500,
  female: 1200,
};

export function calculateMacros(profile: UserProfile): MacroTargets {
  const genderAdjustment = profile.gender === 'male' ? 5 : -161;
  const bmrExact =
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + genderAdjustment;
  const tdeeExact = bmrExact * activityMultipliers[profile.activity];
  const calories = Math.max(
    Math.round(tdeeExact + goalAdjustments[profile.goal]),
    calorieMinimums[profile.gender],
  );
  const netCarbG = 25;
  const proteinG = Math.round(profile.weightKg * 1.6);
  const fatG = Math.round((calories - netCarbG * 4 - proteinG * 4) / 9);

  return {
    calories,
    fatG,
    proteinG,
    netCarbG,
    bmr: Math.round(bmrExact),
    tdee: Math.round(tdeeExact),
  };
}

/** Porsiyon çarpanını uygular; kaydedilen değerler tam sayı olsun diye yuvarlanır. */
export function scaleMacros(macros: FoodMacros, servings: number): FoodMacros {
  return {
    kcal: Math.round(macros.kcal * servings),
    fatG: Math.round(macros.fatG * servings),
    proteinG: Math.round(macros.proteinG * servings),
    netCarbG: Math.round(macros.netCarbG * servings),
  };
}

export function sumMacros(entries: LogEntry[]): FoodMacros {
  return entries.reduce<FoodMacros>(
    (total, entry) => ({
      kcal: total.kcal + entry.macros.kcal,
      fatG: total.fatG + entry.macros.fatG,
      proteinG: total.proteinG + entry.macros.proteinG,
      netCarbG: total.netCarbG + entry.macros.netCarbG,
    }),
    { kcal: 0, fatG: 0, proteinG: 0, netCarbG: 0 },
  );
}

/** Porsiyon gramajından makro hesaplar; per100g değerleri 100 g referanslıdır. */
export function macrosForGrams(per100g: FoodMacros, grams: number): FoodMacros {
  return scaleMacros(per100g, grams / 100);
}
