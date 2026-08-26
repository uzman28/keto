/**
 * Süreli önbellek ve hız sınırlayıcı.
 *
 * FatSecret koşulları çoğu veriyi en fazla 24 saat saklamaya izin veriyor.
 * Sınıra dayanmamak için varsayılan 12 saat; bu bile aynı gün içindeki tekrar
 * aramaların tamamını karşılıyor ve 5.000/gün kotasını rahatlatıyor.
 *
 * NOT: Bu dosya `node --experimental-strip-types` ile doğrudan çalıştırılıyor.
 * Sıyırma modu parametre özelliği (`constructor(private x)`), enum ve namespace
 * desteklemiyor — alanlar bu yüzden açıkça tanımlanıp gövdede atanıyor.
 */
export const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS, maxEntries = 500) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }

    // Map ekleme sırasını koruduğu için, tazeleyince kayıt "en yeni" konuma geçer.
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });

    // En eski kayıttan başlayarak buda; süresi geçmişler zaten okuma anında düşüyor.
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done) {
        break;
      }
      this.entries.delete(oldest.value);
    }
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

/**
 * Basit IP başına hız sınırı. Aracı herkese açık olduğu için, tek bir istemcinin
 * günlük 5.000 çağrı hakkını tüketmesini engelliyor.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit = 60, windowMs = 60_000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /** true dönerse istek kabul edilir. */
  allow(key: string): boolean {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((time) => now - time < this.windowMs);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
