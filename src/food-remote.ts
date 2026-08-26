import Constants from 'expo-constants';

import type { FoodMacros, FoodPortion } from './types';

/**
 * Kendi aracı sunucumuzla konuşan istemci. FatSecret anahtarları burada yok —
 * uygulama sadece arama metnini gönderir, aracı çeviriyi yapıp temiz veri döner.
 */

export interface RemoteFoodResult {
  id: string;
  name: string;
  brand?: string;
  isBranded: boolean;
  /**
   * Arama ucu lif vermediği için `carbG` **toplam** karbonhidrattır.
   * Net karbonhidrat ancak detay çekilince hesaplanabiliyor.
   */
  summary: {
    servingLabel: string;
    kcal: number;
    fatG: number;
    carbG: number;
    proteinG: number;
  } | null;
}

export interface RemoteFood {
  id: string;
  name: string;
  brand?: string;
  isBranded: boolean;
  per100g: FoodMacros;
  portions: FoodPortion[];
  fiberMissing: boolean;
}

const DEV_PROXY_PORT = 8787;
const TIMEOUT_MS = 8000;

/**
 * Aracının adresi.
 *
 * Üretimde `EXPO_PUBLIC_FOOD_API_URL` ile verilir. Geliştirmede Metro'nun
 * host bilgisinden türetilir: telefon zaten bilgisayara o adresten bağlanıyor,
 * aracı da aynı makinede başka bir portta duruyor. `hostUri` Expo tarafından
 * dokümante edilmediği için savunmacı okunuyor — bulunamazsa uzak arama
 * sessizce kapanır, uygulama yerel listeyle çalışmaya devam eder.
 */
function resolveBaseUrl(): string | null {
  const configured = process.env.EXPO_PUBLIC_FOOD_API_URL;

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:${DEV_PROXY_PORT}`;
    }
  }

  return null;
}

const baseUrl = resolveBaseUrl();

export function isRemoteSearchEnabled(): boolean {
  return baseUrl !== null;
}

export class RemoteFoodError extends Error {
  readonly isOffline: boolean;

  constructor(message: string, isOffline = false) {
    super(message);
    this.name = 'RemoteFoodError';
    this.isOffline = isOffline;
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!baseUrl) {
    throw new RemoteFoodError('Besin servisi yapılandırılmamış.', true);
  }

  // Kendi zaman aşımımız: ağ takılırsa kullanıcı sonsuza kadar dönen çark görmesin.
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);

  // Dışarıdan gelen iptal (yeni tuşa basıldı) ile zaman aşımını birleştiriyoruz.
  const onAbort = () => timeout.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const response = await fetch(`${baseUrl}${path}`, { signal: timeout.signal });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new RemoteFoodError(body?.error ?? `Servis hatası (${response.status}).`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof RemoteFoodError) {
      throw error;
    }
    if (signal?.aborted) {
      throw error;
    }
    throw new RemoteFoodError('Besin servisine ulaşılamadı.', true);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function searchRemoteFoods(
  query: string,
  signal?: AbortSignal,
): Promise<RemoteFoodResult[]> {
  const data = await getJson<{ results?: RemoteFoodResult[] }>(
    `/api/foods/search?q=${encodeURIComponent(query)}&limit=20`,
    signal,
  );

  return data.results ?? [];
}

export async function fetchRemoteFood(id: string, signal?: AbortSignal): Promise<RemoteFood> {
  const data = await getJson<{ food?: RemoteFood }>(`/api/foods/${encodeURIComponent(id)}`, signal);

  if (!data.food) {
    throw new RemoteFoodError('Besin ayrıntısı alınamadı.');
  }

  return data.food;
}
