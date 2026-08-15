import type { ActivityLevel, Gender, Goal, MacroTargets, UserProfile } from './types';

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
