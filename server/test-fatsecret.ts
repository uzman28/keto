/**
 * FatSecret bağlantısını uçtan uca doğrular: ara → seç → detayını çek.
 *
 *   FATSECRET_CLIENT_ID=... FATSECRET_CLIENT_SECRET=... node server/test-fatsecret.ts egg
 *
 * Not: Çağrının yapıldığı IP FatSecret panelinde whitelist'te olmalı,
 * yoksa "hata 21 Invalid IP address detected" gelir.
 */

import { getFoodById, searchFoods } from './fatsecret.ts';

const clientId = process.env.FATSECRET_CLIENT_ID ?? '';
const clientSecret = process.env.FATSECRET_CLIENT_SECRET ?? '';
const query = process.argv[2] ?? 'egg';

if (!clientId || !clientSecret) {
  console.error('FATSECRET_CLIENT_ID ve FATSECRET_CLIENT_SECRET tanımlı olmalı.');
  process.exit(1);
}

const config = { clientId, clientSecret };

try {
  console.log(`1. ADIM — arama: "${query}"\n`);
  const results = await searchFoods(config, query, 8);

  for (const result of results) {
    const label = result.brand ? `${result.name} [${result.brand}]` : result.name;
    const s = result.summary;
    console.log(`  ${label}${result.isBranded ? ' (marka)' : ''}  · id ${result.id}`);
    console.log(
      s
        ? `      ${s.servingLabel}: ${s.kcal} kcal · ${s.fatG} g yağ · ${s.carbG} g karb · ${s.proteinG} g protein`
        : '      (özet çözümlenemedi)',
    );
  }

  const unparsed = results.filter((result) => result.summary === null).length;
  console.log(`\n  ${results.length} sonuç, ${unparsed} tanesinin özeti çözümlenemedi.`);

  if (results.length === 0) {
    console.log('\nSonuç yok, detay adımı atlanıyor.');
    process.exit(0);
  }

  const first = results[0];
  console.log(`\n2. ADIM — detay: "${first.name}" (id ${first.id})\n`);

  const detail = await getFoodById(config, first.id);

  if (!detail) {
    console.log('  Detay gram karşılığı içermiyor, makro hesabına elverişli değil.');
  } else {
    const { kcal, fatG, proteinG, netCarbG } = detail.per100g;
    console.log(`  ${detail.name}${detail.brand ? ` [${detail.brand}]` : ''}`);
    console.log(`  100 g: ${kcal} kcal · ${fatG} g yağ · ${proteinG} g protein · ${netCarbG} g NET karb`);
    console.log(`  lif bilgisi: ${detail.fiberMissing ? 'YOK (net karb toplama eşitlendi)' : 'var'}`);
    console.log(`  porsiyonlar (${detail.portions.length}):`);
    for (const portion of detail.portions.slice(0, 6)) {
      console.log(`    - ${portion.label} (${portion.grams} g)`);
    }
  }

  console.log('\n---\nBAGLANTI CALISIYOR — arama ve detay, ikisi de ücretsiz katmanda.');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('HATA:', message);

  if (message.includes('Invalid IP')) {
    console.error('\n→ Bu IP whitelist’te değil. FatSecret panelinde IP Restrictions bölümüne ekle.');
  } else if (message.includes('premier')) {
    console.error('\n→ Bu uç ücretsiz katmanda kapalı; Basic’te açık olan uçları kullanmalıyız.');
  } else if (message.includes('HTTP 401') || message.includes('invalid_client')) {
    console.error('\n→ Client ID veya Secret hatalı görünüyor.');
  }

  process.exit(1);
}
