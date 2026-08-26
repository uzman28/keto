/**
 * FatSecret Platform API istemcisi.
 *
 * Yalnızca web standardı API kullanır (fetch, btoa) — Fly.io, VPS, Deno ve
 * Node 20+ üzerinde aynı kodla çalışır. Barındırma sabit çıkış IP'si gerektirir:
 * FatSecret yalnızca whitelist'teki IP'lerden çağrı kabul ediyor (hata 21).
 *
 * ÜCRETSİZ KATMAN KISITI
 * `foods.search.v3` ve `/rest/foods/search/v3` "premier" scope istiyor (hata 14).
 * Basic'te açık olanlar:
 *   - foods.search (v1, server.api)  → id + ad + özet metin, LİF YOK
 *   - food.get.v5 (/rest/food/v5)    → tam değerler, lif ve tüm porsiyonlar dahil
 *
 * Bu yüzden akış iki adımlı: önce ara, kullanıcı seçince detayı çek. Yan faydası,
 * 5.000/gün kotasının 50 sonucun tamamı için detay çekilerek harcanmaması.
 */

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const LEGACY_URL = 'https://platform.fatsecret.com/rest/server.api';
const FOOD_URL = 'https://platform.fatsecret.com/rest/food/v5';

export interface FatSecretConfig {
  clientId: string;
  clientSecret: string;
}

/** Arama listesinde gösterilen hafif sonuç. */
export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  isBranded: boolean;
  /**
   * Arama ucunun döndürdüğü özet. Lif içermediği için `carbG` **toplam**
   * karbonhidrattır, net karbonhidrat değildir. Net değer detay çağrısında gelir.
   */
  summary: {
    servingLabel: string;
    kcal: number;
    fatG: number;
    carbG: number;
    proteinG: number;
  } | null;
}

export interface NormalizedPortion {
  label: string;
  grams: number;
}

export interface NormalizedFood {
  /** FatSecret food_id. Kalıcı saklanabilen tek alan. */
  id: string;
  name: string;
  brand?: string;
  isBranded: boolean;
  per100g: { kcal: number; fatG: number; proteinG: number; netCarbG: number };
  portions: NormalizedPortion[];
  /**
   * Lif alanı boş geldiğinde net karbonhidrat toplam karbonhidrata eşitlenir,
   * yani gerçekte olduğundan yüksek görünür. Arayüz bunu kullanıcıya söylemeli.
   */
  fiberMissing: boolean;
  source: 'fatsecret';
}

/** Token 24 saat geçerli; her istekte yeniden almak hem yavaş hem gereksiz. */
let cachedToken: { value: string; expiresAt: number } | null = null;

export function resetTokenCache(): void {
  cachedToken = null;
}

export async function getAccessToken(config: FatSecretConfig): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Token alınamadı (HTTP ${response.status}): ${text}`);
  }

  const data = JSON.parse(text) as { access_token: string; expires_in: number };

  // Süre dolmadan 60 sn önce yenile ki uçuş hâlindeki istek 401 yemesin.
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.value;
}

/**
 * FatSecret tek elemanlı listeleri dizi yerine düz nesne olarak döndürür.
 * Bu ayrımı kaçırmak, "tek sonuç dönünce patlıyor" hatasının klasik kaynağı.
 */
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function num(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** FatSecret'ın "böyle bir kayıt yok" kodu; hata değil, bulunamadı demek. */
const INVALID_ID_CODE = 106;

function apiError(parsed: unknown): { code?: number; message?: string } | undefined {
  return (parsed as { error?: { code?: number; message?: string } }).error;
}

function throwIfApiError(parsed: unknown): void {
  const err = apiError(parsed);
  if (err) {
    throw new Error(`FatSecret hatası ${err.code}: ${err.message}`);
  }
}

/**
 * Arama ucu makroları yapısal alan yerine tek satır metinde veriyor:
 *   "Per 100g - Calories: 147kcal | Fat: 9.94g | Carbs: 0.77g | Protein: 12.58g"
 */
const DESCRIPTION_PATTERN =
  /^Per\s+(.+?)\s+-\s+Calories:\s*([\d.]+)kcal\s*\|\s*Fat:\s*([\d.]+)g\s*\|\s*Carbs:\s*([\d.]+)g\s*\|\s*Protein:\s*([\d.]+)g/i;

export function parseFoodDescription(description: string | undefined): FoodSearchResult['summary'] {
  if (!description) {
    return null;
  }

  const match = DESCRIPTION_PATTERN.exec(description.trim());
  if (!match) {
    return null;
  }

  return {
    servingLabel: match[1],
    kcal: Number(match[2]),
    fatG: Number(match[3]),
    carbG: Number(match[4]),
    proteinG: Number(match[5]),
  };
}

interface RawSearchFood {
  food_id?: string;
  food_name?: string;
  food_type?: string;
  brand_name?: string;
  food_description?: string;
}

export async function searchFoods(
  config: FatSecretConfig,
  query: string,
  maxResults = 20,
): Promise<FoodSearchResult[]> {
  const token = await getAccessToken(config);

  const response = await fetch(LEGACY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      method: 'foods.search',
      search_expression: query,
      max_results: String(Math.min(maxResults, 50)),
      format: 'json',
    }).toString(),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Arama başarısız (HTTP ${response.status}): ${text}`);
  }

  const data = JSON.parse(text) as { foods?: { food?: RawSearchFood | RawSearchFood[] } };
  // FatSecret hataları HTTP 200 gövdesinde de dönebiliyor.
  throwIfApiError(data);

  return toArray(data.foods?.food)
    .filter((food) => food.food_id && food.food_name)
    .map((food) => ({
      id: food.food_id as string,
      name: food.food_name as string,
      brand: food.brand_name,
      isBranded: food.food_type === 'Brand',
      summary: parseFoodDescription(food.food_description),
    }));
}

interface RawServing {
  serving_description?: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  calories?: string;
  carbohydrate?: string;
  protein?: string;
  fat?: string;
  fiber?: string;
}

interface RawFood {
  food_id?: string;
  food_name?: string;
  food_type?: string;
  brand_name?: string;
  servings?: { serving?: RawServing | RawServing[] };
}

/**
 * Porsiyon başına gelen değerleri 100 g referansına çevirir.
 *
 * Gram/ml cinsinden ölçüsü olan bir porsiyondan türetiyoruz. İçeceklerde ml,
 * gram gibi kabul ediliyor — su yoğunluğu varsayımı, sıvılarda pratikte yeterli.
 */
export function normalizeFood(raw: RawFood): NormalizedFood | null {
  const id = raw.food_id;
  const name = raw.food_name;

  if (!id || !name) {
    return null;
  }

  const servings = toArray(raw.servings?.serving);
  const metricServing = servings.find((serving) => {
    const unit = serving.metric_serving_unit?.toLowerCase();
    return (unit === 'g' || unit === 'ml') && (num(serving.metric_serving_amount) ?? 0) > 0;
  });

  if (!metricServing) {
    // Gram karşılığı olmayan kayıt ("1 porsiyon" gibi) makro hesabına elverişli değil.
    return null;
  }

  const amount = num(metricServing.metric_serving_amount) as number;
  const factor = 100 / amount;

  const carbohydrate = num(metricServing.carbohydrate) ?? 0;
  const fiber = num(metricServing.fiber);
  const fiberMissing = fiber === undefined;
  // Lif bilinmiyorsa çıkarma yapılamaz; net karbonhidrat toplamla eşitlenir.
  const netCarb = Math.max(0, carbohydrate - (fiber ?? 0));

  const round = (value: number) => Math.round(value * 10) / 10;

  const portions = servings
    .map((serving) => ({
      label: serving.serving_description ?? '1 porsiyon',
      grams: Math.round(num(serving.metric_serving_amount) ?? 0),
    }))
    .filter((portion) => portion.grams > 0);

  return {
    id,
    name,
    brand: raw.brand_name,
    isBranded: raw.food_type === 'Brand',
    per100g: {
      kcal: Math.round((num(metricServing.calories) ?? 0) * factor),
      fatG: round((num(metricServing.fat) ?? 0) * factor),
      proteinG: round((num(metricServing.protein) ?? 0) * factor),
      netCarbG: round(netCarb * factor),
    },
    portions: portions.length > 0 ? portions : [{ label: `${amount} g`, grams: Math.round(amount) }],
    fiberMissing,
    source: 'fatsecret',
  };
}

/** Tam değerleri getirir: lif, dolayısıyla gerçek net karbonhidrat ve tüm porsiyonlar. */
export async function getFoodById(
  config: FatSecretConfig,
  foodId: string,
): Promise<NormalizedFood | null> {
  const token = await getAccessToken(config);

  const url = new URL(FOOD_URL);
  url.searchParams.set('food_id', foodId);
  url.searchParams.set('format', 'json');

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Besin getirilemedi (HTTP ${response.status}): ${text}`);
  }

  const data = JSON.parse(text) as { food?: RawFood };

  // Geçersiz ID bir arıza değil, "bulunamadı" durumu — çağıran 404 üretebilsin.
  const err = apiError(data);
  if (err?.code === INVALID_ID_CODE) {
    return null;
  }
  throwIfApiError(data);

  return data.food ? normalizeFood(data.food) : null;
}
