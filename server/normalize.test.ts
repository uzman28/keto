/**
 * Normalleştirmeyi anahtar olmadan doğrular: sahte FatSecret gövdeleriyle
 * 100 g dönüşümü, net karbonhidrat hesabı ve API'nin tekil/dizi tutarsızlığı.
 *
 * Çalıştırma:  node server/normalize.test.ts
 */

import { normalizeFood, parseFoodDescription } from './fatsecret.ts';

let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log('ok   ' + name);
  } else {
    failed += 1;
    console.log(
      `FAIL ${name}: bekleniyordu ${JSON.stringify(expected)}, geldi ${JSON.stringify(actual)}`,
    );
  }
}

console.log('--- Arama özeti çözümleme (ücretsiz katman arama ucu) ---');
check(
  '100g biciminde ozet',
  parseFoodDescription('Per 100g - Calories: 147kcal | Fat: 9.94g | Carbs: 0.77g | Protein: 12.58g'),
  { servingLabel: '100g', kcal: 147, fatG: 9.94, carbG: 0.77, proteinG: 12.58 },
);
check(
  'adet biciminde ozet',
  parseFoodDescription('Per 1 egg - Calories: 70kcal | Fat: 5.00g | Carbs: 0.00g | Protein: 6.00g'),
  { servingLabel: '1 egg', kcal: 70, fatG: 5, carbG: 0, proteinG: 6 },
);
check(
  'cok kelimeli porsiyon adi',
  parseFoodDescription('Per 1 cup, chopped - Calories: 31kcal | Fat: 0.34g | Carbs: 6.04g | Protein: 2.57g')
    ?.servingLabel,
  '1 cup, chopped',
);
check('bicimsiz metin', parseFoodDescription('bilinmeyen bir metin'), null);
check('bos girdi', parseFoodDescription(undefined), null);

// 1 büyük yumurta: 50 g, 72 kcal, 4.8 g yağ, 6.3 g protein, 0.4 g karb, lif yok
const egg = {
  food_id: '33691',
  food_name: 'Egg',
  food_type: 'Generic',
  servings: {
    serving: {
      serving_description: '1 large',
      metric_serving_amount: '50.000',
      metric_serving_unit: 'g',
      calories: '72',
      carbohydrate: '0.36',
      protein: '6.28',
      fat: '4.76',
      fiber: '0',
    },
  },
};

const eggResult = normalizeFood(egg)!;
console.log('--- 100 g dönüşümü (tek porsiyon, nesne olarak) ---');
check('id', eggResult.id, '33691');
check('ad', eggResult.name, 'Egg');
check('markasiz', eggResult.isBranded, false);
check('100 g makro', eggResult.per100g, { kcal: 144, fatG: 9.5, proteinG: 12.6, netCarbG: 0.7 });
check('porsiyon', eggResult.portions, [{ label: '1 large', grams: 50 }]);
check('lif var', eggResult.fiberMissing, false);

console.log('\n--- Net karbonhidrat: lif çıkarılıyor mu ---');
const broccoli = normalizeFood({
  food_id: '1',
  food_name: 'Broccoli',
  food_type: 'Generic',
  servings: {
    serving: [
      {
        serving_description: '100 g',
        metric_serving_amount: '100.000',
        metric_serving_unit: 'g',
        calories: '34',
        carbohydrate: '6.64',
        protein: '2.82',
        fat: '0.37',
        fiber: '2.6',
      },
    ],
  },
})!;
// 6.64 - 2.6 = 4.04
check('lif dusuluyor', broccoli.per100g.netCarbG, 4);

console.log('\n--- Lif eksikse ne oluyor ---');
const noFiber = normalizeFood({
  food_id: '2',
  food_name: 'Mystery Bar',
  food_type: 'Brand',
  brand_name: 'ACME',
  servings: {
    serving: {
      serving_description: '1 bar',
      metric_serving_amount: '40.000',
      metric_serving_unit: 'g',
      calories: '200',
      carbohydrate: '20',
      protein: '5',
      fat: '10',
    },
  },
})!;
check('lif eksigi isaretlendi', noFiber.fiberMissing, true);
check('net karb toplama esitlendi', noFiber.per100g.netCarbG, 50);
check('marka okundu', noFiber.brand, 'ACME');
check('markali isaretlendi', noFiber.isBranded, true);

console.log('\n--- Tekil/dizi tutarsızlığı ---');
const multi = normalizeFood({
  food_id: '3',
  food_name: 'Milk',
  food_type: 'Generic',
  servings: {
    serving: [
      { serving_description: '1 cup', metric_serving_amount: '244.000', metric_serving_unit: 'ml', calories: '149', carbohydrate: '11.7', protein: '7.69', fat: '7.93', fiber: '0' },
      { serving_description: '100 ml', metric_serving_amount: '100.000', metric_serving_unit: 'ml', calories: '61', carbohydrate: '4.8', protein: '3.15', fat: '3.25', fiber: '0' },
    ],
  },
})!;
check('iki porsiyon da okundu', multi.portions.length, 2);
check('ml gram gibi ele alindi', multi.per100g.kcal, 61);

console.log('\n--- Elverişsiz kayıtlar eleniyor ---');
check(
  'gram karsiligi olmayan kayit',
  normalizeFood({
    food_id: '4',
    food_name: 'Homemade Soup',
    food_type: 'Generic',
    servings: { serving: { serving_description: '1 serving', calories: '150', carbohydrate: '10' } },
  }),
  null,
);
check('id yoksa', normalizeFood({ food_name: 'Nameless' }), null);
check('porsiyon yoksa', normalizeFood({ food_id: '5', food_name: 'Empty' }), null);

console.log('\n--- Negatif net karbonhidrat olamaz ---');
const weird = normalizeFood({
  food_id: '6',
  food_name: 'Fiber Supplement',
  food_type: 'Generic',
  servings: {
    serving: {
      serving_description: '10 g',
      metric_serving_amount: '10.000',
      metric_serving_unit: 'g',
      calories: '20',
      carbohydrate: '5',
      protein: '0',
      fat: '0',
      fiber: '8',
    },
  },
})!;
check('sifira kirpildi', weird.per100g.netCarbG, 0);

console.log(failed === 0 ? '\nTUM KONTROLLER GECTI' : `\n${failed} KONTROL BASARISIZ`);
process.exit(failed === 0 ? 0 : 1);
