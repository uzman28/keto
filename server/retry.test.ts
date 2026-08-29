/**
 * Yeniden deneme davranışını ağa çıkmadan doğrular: geçici hata tekrarlanıyor mu,
 * kalıcı hata ilk denemede fırlatılıyor mu, deneme sayısı sınırlanıyor mu.
 *
 * `fetch` yerine sahte bir uygulama koyup gerçek `searchFoods` çağrılıyor.
 *
 * Çalıştırma:  node server/retry.test.ts
 */

import { FatSecretError, resetTokenCache, searchFoods } from './fatsecret.ts';

let failed = 0;

function check(name: string, actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    console.log('ok   ' + name);
  } else {
    failed += 1;
    console.log(
      `FAIL ${name}: bekleniyordu ${JSON.stringify(expected)}, geldi ${JSON.stringify(actual)}`,
    );
  }
}

const config = { clientId: 'test-id', clientSecret: 'test-secret' };
const realFetch = globalThis.fetch;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const TOKEN_BODY = { access_token: 'sahte-token', expires_in: 86400 };
const INVALID_IP = { error: { code: 21, message: "Invalid IP address detected:  '1.2.3.4'" } };
const PREMIER = { error: { code: 14, message: "Missing scope: scope 'premier'" } };
const RESULT = {
  foods: {
    food: {
      food_id: '3092',
      food_name: 'Egg',
      food_type: 'Generic',
      food_description: 'Per 100g - Calories: 147kcal | Fat: 9.94g | Carbs: 0.77g | Protein: 12.58g',
    },
  },
};

/** İlk `failCount` aramayı reddeder, sonrakini geçirir. Çağrı sayısını sayar. */
function installFakeFetch(failCount: number, failBody: unknown = INVALID_IP) {
  let searchCalls = 0;

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);

    if (url.includes('oauth.fatsecret.com')) {
      return jsonResponse(TOKEN_BODY);
    }

    searchCalls += 1;
    return jsonResponse(searchCalls <= failCount ? failBody : RESULT);
  }) as typeof fetch;

  return () => searchCalls;
}

async function run(): Promise<void> {
  console.log('--- Geçici hata (21) yeniden deneniyor ---');
  resetTokenCache();
  let calls = installFakeFetch(3);
  let results = await searchFoods(config, 'egg');
  check('4. denemede sonuç döndü', results.length, 1);
  check('tam 4 arama isteği yapıldı', calls(), 4);
  check('sonuç doğru çözümlendi', results[0].name, 'Egg');

  console.log('\n--- İlk denemede geçerse tekrar edilmiyor ---');
  resetTokenCache();
  calls = installFakeFetch(0);
  await searchFoods(config, 'egg');
  check('tek istek', calls(), 1);

  console.log('\n--- Kalıcı hata (14 premier) hemen fırlatılıyor ---');
  resetTokenCache();
  calls = installFakeFetch(99, PREMIER);
  let thrown: unknown;
  try {
    await searchFoods(config, 'egg');
  } catch (error) {
    thrown = error;
  }
  check('hata fırlatıldı', thrown instanceof FatSecretError, true);
  check('kod 14', (thrown as FatSecretError).code, 14);
  check('geçici sayılmadı', (thrown as FatSecretError).isTransient, false);
  check('yeniden denenmedi', calls(), 1);

  console.log('\n--- Sürekli geçici hata: deneme sayısı sınırlı ---');
  resetTokenCache();
  calls = installFakeFetch(99, INVALID_IP);
  thrown = undefined;
  try {
    await searchFoods(config, 'egg');
  } catch (error) {
    thrown = error;
  }
  check('sonunda fırlatıldı', thrown instanceof FatSecretError, true);
  check('kod 21', (thrown as FatSecretError).code, 21);
  check('geçici sayıldı', (thrown as FatSecretError).isTransient, true);
  check('10 denemede durdu', calls(), 10);

  console.log('\n--- Token yalnızca bir kez alınıyor ---');
  resetTokenCache();
  let tokenCalls = 0;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes('oauth.fatsecret.com')) {
      tokenCalls += 1;
      return jsonResponse(TOKEN_BODY);
    }
    return jsonResponse(RESULT);
  }) as typeof fetch;
  await searchFoods(config, 'egg');
  await searchFoods(config, 'cheese');
  check('iki arama, tek token isteği', tokenCalls, 1);
}

try {
  await run();
} finally {
  globalThis.fetch = realFetch;
}

console.log(failed === 0 ? '\nTUM KONTROLLER GECTI' : `\n${failed} KONTROL BASARISIZ`);
process.exit(failed === 0 ? 0 : 1);
