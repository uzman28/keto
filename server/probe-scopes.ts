/**
 * Ücretsiz Basic katmanında hangi uçların açık olduğunu tarar.
 *
 *   node server/probe-scopes.ts
 *
 * v3 arama "premier" scope istiyor. Eski uçlar Basic'te çalışıyor mu, ve
 * çalışıyorsa lif bilgisi veriyor mu — net karbonhidrat buna bağlı.
 */

const clientId = process.env.FATSECRET_CLIENT_ID ?? '';
const clientSecret = process.env.FATSECRET_CLIENT_SECRET ?? '';

if (!clientId || !clientSecret) {
  console.error('FATSECRET_CLIENT_ID ve FATSECRET_CLIENT_SECRET tanımlı olmalı.');
  process.exit(1);
}

async function token(scope: string): Promise<string | null> {
  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&scope=${encodeURIComponent(scope)}`,
  });
  if (!response.ok) {
    console.log(`  scope "${scope}" reddedildi: HTTP ${response.status} ${await response.text()}`);
    return null;
  }
  const data = (await response.json()) as { access_token: string; scope?: string };
  console.log(`  scope "${scope}" alındı${data.scope ? ` (verilen: ${data.scope})` : ''}`);
  return data.access_token;
}

async function tryGet(name: string, url: string, accessToken: string): Promise<void> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.log(`  ${name}: HTTP ${response.status}, JSON değil -> ${text.slice(0, 120)}`);
    return;
  }
  const err = (parsed as { error?: { code?: number; message?: string } }).error;
  if (err) {
    console.log(`  ${name}: HATA ${err.code} — ${err.message}`);
    return;
  }
  console.log(`  ${name}: ÇALIŞIYOR`);
  console.log('    ' + JSON.stringify(parsed).slice(0, 600));
}

async function tryPost(name: string, params: Record<string, string>, accessToken: string): Promise<void> {
  const response = await fetch('https://platform.fatsecret.com/rest/server.api', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.log(`  ${name}: HTTP ${response.status}, JSON değil -> ${text.slice(0, 120)}`);
    return;
  }
  const err = (parsed as { error?: { code?: number; message?: string } }).error;
  if (err) {
    console.log(`  ${name}: HATA ${err.code} — ${err.message}`);
    return;
  }
  console.log(`  ${name}: ÇALIŞIYOR`);
  console.log('    ' + JSON.stringify(parsed).slice(0, 900));
}

console.log('=== Token scope denemeleri ===');
const basic = await token('basic');
await token('premier');
await token('basic premier');

if (!basic) {
  console.error('Basic token alınamadı, devam edilemiyor.');
  process.exit(1);
}

console.log('\n=== Yeni REST uçları (Bearer + basic) ===');
await tryGet(
  'GET /rest/foods/search/v3',
  'https://platform.fatsecret.com/rest/foods/search/v3?search_expression=egg&max_results=2&format=json',
  basic,
);
await tryGet(
  'GET /rest/foods/search   (v1)',
  'https://platform.fatsecret.com/rest/foods/search?search_expression=egg&max_results=2&format=json',
  basic,
);
await tryGet(
  'GET /rest/food/v5',
  'https://platform.fatsecret.com/rest/food/v5?food_id=33691&format=json',
  basic,
);
await tryGet(
  'GET /rest/food/v4',
  'https://platform.fatsecret.com/rest/food/v4?food_id=33691&format=json',
  basic,
);

console.log('\n=== Eski tek uç (server.api) ===');
await tryPost('foods.search', { method: 'foods.search', search_expression: 'egg', max_results: '2', format: 'json' }, basic);
await tryPost('foods.search.v3', { method: 'foods.search.v3', search_expression: 'egg', max_results: '2', format: 'json' }, basic);
await tryPost('food.get.v2', { method: 'food.get.v2', food_id: '33691', format: 'json' }, basic);
await tryPost('food.get.v4', { method: 'food.get.v4', food_id: '33691', format: 'json' }, basic);

export {};
