/**
 * Uygulamanın konuştuğu uç noktalar. Platformdan bağımsız: düz nesne alır,
 * düz nesne döner. Node girişi `server.ts`; Fly.io/VPS/Deno için de aynı çekirdek
 * kullanılır, sadece adaptör değişir.
 *
 *   GET /api/foods/search?q=egg&limit=20
 *   GET /api/foods/33691
 *   GET /health
 */

import { RateLimiter, TtlCache } from './cache.ts';
import { getFoodById, searchFoods } from './fatsecret.ts';
import type { FatSecretConfig, FoodSearchResult, NormalizedFood } from './fatsecret.ts';

export interface ApiRequest {
  path: string;
  query: URLSearchParams;
  clientIp: string;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}

const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 30;

export function createApi(config: FatSecretConfig) {
  const searchCache = new TtlCache<FoodSearchResult[]>();
  const foodCache = new TtlCache<NormalizedFood | null>();
  const limiter = new RateLimiter();

  async function handle(request: ApiRequest): Promise<ApiResponse> {
    if (!limiter.allow(request.clientIp)) {
      return { status: 429, body: { error: 'Çok fazla istek. Biraz sonra tekrar deneyin.' } };
    }

    if (request.path === '/health') {
      return {
        status: 200,
        body: { ok: true, cachedSearches: searchCache.size, cachedFoods: foodCache.size },
      };
    }

    if (request.path === '/api/foods/search') {
      const query = (request.query.get('q') ?? '').trim();

      if (query.length < MIN_QUERY_LENGTH) {
        return { status: 400, body: { error: `En az ${MIN_QUERY_LENGTH} harf gerekli.` } };
      }

      const limit = Math.min(Number(request.query.get('limit')) || 20, MAX_LIMIT);
      // Büyük/küçük harf ve boşluk farkı ayrı önbellek kaydı açmasın.
      const cacheKey = `${query.toLowerCase()}::${limit}`;
      const cached = searchCache.get(cacheKey);

      if (cached) {
        return { status: 200, body: { results: cached, cached: true } };
      }

      const results = await searchFoods(config, query, limit);
      searchCache.set(cacheKey, results);
      return { status: 200, body: { results, cached: false } };
    }

    const foodMatch = /^\/api\/foods\/([\w-]+)$/.exec(request.path);

    if (foodMatch) {
      const foodId = foodMatch[1];
      const cached = foodCache.get(foodId);

      if (cached !== undefined) {
        return cached
          ? { status: 200, body: { food: cached, cached: true } }
          : { status: 404, body: { error: 'Besin bulunamadı ya da gram karşılığı yok.' } };
      }

      const food = await getFoodById(config, foodId);
      foodCache.set(foodId, food);

      return food
        ? { status: 200, body: { food, cached: false } }
        : { status: 404, body: { error: 'Besin bulunamadı ya da gram karşılığı yok.' } };
    }

    return { status: 404, body: { error: 'Bilinmeyen uç nokta.' } };
  }

  /** Dışarıya hata ayrıntısı sızdırmadan, loglanabilir biçimde sarmalar. */
  return async function api(request: ApiRequest): Promise<ApiResponse> {
    try {
      return await handle(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[api] ${request.path} — ${message}`);

      if (message.includes('Invalid IP')) {
        return { status: 502, body: { error: 'Sunucu IP’si FatSecret whitelist’inde değil.' } };
      }
      if (message.includes('premier')) {
        return { status: 502, body: { error: 'Bu uç ücretsiz katmanda kapalı.' } };
      }

      return { status: 502, body: { error: 'Besin servisine ulaşılamadı.' } };
    }
  };
}
