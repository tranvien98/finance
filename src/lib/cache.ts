interface CacheItem {
  value: any;
  expiry: number;
}

/**
 * In-memory cache to store API responses or intermediate calculations.
 * Persists during the lifetime of the serverless function.
 */
const cache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export function getCache(key: string) {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

export function setCache(key: string, value: any) {
  cache.set(key, {
    value,
    expiry: Date.now() + CACHE_TTL_MS,
  });
}
