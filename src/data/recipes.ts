import type { Recipe } from '../types';

import { breakfastRecipes } from './recipes/breakfast';
import { dinnerRecipes } from './recipes/dinner';
import { lunchRecipes } from './recipes/lunch';
import { snackAndDessertRecipes } from './recipes/snacks';

export const recipes: Recipe[] = [
  ...breakfastRecipes,
  ...lunchRecipes,
  ...dinnerRecipes,
  ...snackAndDessertRecipes,
];
