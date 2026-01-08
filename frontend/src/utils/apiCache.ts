/**
 * Basit API Cache Utility
 * Kısa süreli (varsayılan 30sn) önbellek ile API çağrılarını hızlandırır
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 30 * 1000; // 30 saniye

  /**
   * Cache'den veri al veya fetch yap
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Cache geçerliyse döndür
    if (cached && now < cached.expiry) {
      return cached.data;
    }

    // Yeni veri çek
    const data = await fetchFn();
    
    // Cache'e kaydet
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl
    });

    return data;
  }

  /**
   * Belirli bir key'i cache'den sil
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Pattern ile eşleşen tüm key'leri sil
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Tüm cache'i temizle
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cache boyutunu al
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const apiCache = new ApiCache();

/**
 * Fetch helper with caching
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl?: number
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options?.headers || {})}`;
  
  return apiCache.get<T>(
    cacheKey,
    async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    },
    ttl
  );
}

