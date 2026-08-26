// Aracıyı canlı olarak yoklar: sağlık, arama, önbellek, detay, hata durumları.
// Kullanım: node server/smoke.js [taban-url]

const base = process.argv[2] || 'http://localhost:8787';
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log('ok   ' + name + (detail ? '  ' + detail : ''));
  } else {
    failed += 1;
    console.log('FAIL ' + name + (detail ? '  ' + detail : ''));
  }
}

async function get(path) {
  const response = await fetch(base + path);
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

console.log('--- sağlık ---');
const health = await get('/health');
check('/health 200 dönüyor', health.status === 200, 'status ' + health.status);
check('ok bayrağı', health.body && health.body.ok === true);

console.log('\n--- arama ---');
const first = await get('/api/foods/search?q=avocado&limit=3');
check('arama 200', first.status === 200, 'status ' + first.status);
const results = (first.body && first.body.results) || [];
check('sonuç geldi', results.length > 0, results.length + ' sonuç');
check('ilk çağrı önbellekten değil', first.body && first.body.cached === false);

for (const item of results) {
  const s = item.summary;
  console.log(
    '     ' + item.name + (item.brand ? ' [' + item.brand + ']' : '') +
      (s ? '  ' + s.servingLabel + ': ' + s.kcal + ' kcal, ' + s.carbG + ' g karb' : '  (özet yok)') +
      '  id ' + item.id,
  );
}
check('hepsinde id var', results.every((r) => typeof r.id === 'string' && r.id.length > 0));
check('hepsinde ad var', results.every((r) => typeof r.name === 'string' && r.name.length > 0));

console.log('\n--- önbellek ---');
const second = await get('/api/foods/search?q=AVOCADO&limit=3');
check('büyük harf aynı önbelleğe düşüyor', second.body && second.body.cached === true);

console.log('\n--- detay ---');
const detail = await get('/api/foods/' + results[0].id);
check('detay 200', detail.status === 200, 'status ' + detail.status);
const food = detail.body && detail.body.food;
if (food) {
  console.log('     ' + food.name);
  console.log(
    '     100 g: ' + food.per100g.kcal + ' kcal · ' + food.per100g.fatG + ' g yağ · ' +
      food.per100g.proteinG + ' g protein · ' + food.per100g.netCarbG + ' g NET karb',
  );
  console.log('     lif: ' + (food.fiberMissing ? 'YOK' : 'var') + ' · porsiyon: ' + food.portions.length);
  check('100 g değerleri sayı', ['kcal', 'fatG', 'proteinG', 'netCarbG'].every((k) => typeof food.per100g[k] === 'number'));
  check('en az bir porsiyon', food.portions.length > 0);
  check('porsiyon gramajları pozitif', food.portions.every((p) => p.grams > 0));
} else {
  check('detay gövdesi', false, JSON.stringify(detail.body));
}

const detailCached = await get('/api/foods/' + results[0].id);
check('detay önbelleğe girdi', detailCached.body && detailCached.body.cached === true);

console.log('\n--- hata durumları ---');
const short = await get('/api/foods/search?q=a');
check('tek harf 400', short.status === 400, 'status ' + short.status);
const missing = await get('/api/foods/999999999999');
check('olmayan besin 404', missing.status === 404, 'status ' + missing.status);
const unknown = await get('/bilinmeyen');
check('bilinmeyen yol 404', unknown.status === 404, 'status ' + unknown.status);

console.log(failed === 0 ? '\nTUM KONTROLLER GECTI' : '\n' + failed + ' KONTROL BASARISIZ');
process.exit(failed === 0 ? 0 : 1);
