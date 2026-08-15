import { calculateMacros } from './macros';
import type { MacroTargets, UserProfile } from './types';

function assertEqual<T>(actual: T, expected: T, name: string): void {
  if (actual !== expected) {
    throw new Error(`${name}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

const profile: UserProfile = {
  gender: 'male',
  age: 30,
  heightCm: 178,
  weightKg: 85,
  activity: 'moderate',
  goal: 'lose',
  createdAt: '2026-08-14T00:00:00.000Z',
};

const expected: MacroTargets = {
  bmr: 1818,
  tdee: 2817,
  calories: 2317,
  netCarbG: 25,
  proteinG: 136,
  fatG: 186,
};

const actual = calculateMacros(profile);

for (const key of Object.keys(expected) as Array<keyof MacroTargets>) {
  assertEqual(actual[key], expected[key], key);
}
