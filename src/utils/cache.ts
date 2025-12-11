/**
 * API Response Caching Utility
 * 
 * Provides localStorage-based caching for API responses to reduce latency.
 * Implements TTL (Time To Live) for cache invalidation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const CACHE_PREFIX = 'api_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

/**
 * Generate cache key from endpoint and params
 */
export const getCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${endpoint}_${paramString}`;
};

/**
 * Get cached data if it exists and is still valid
 */
export const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('Error reading cache:', error);
    return null;
  }
};

/**
 * Set data in cache with TTL
 */
export const setCachedData = <T>(key: string, data: T, ttl: number = DEFAULT_TTL): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Clear old cache entries
      clearOldCacheEntries();
      // Try again
      try {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          ttl,
        };
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (retryError) {
        console.warn('Failed to cache data after cleanup:', retryError);
      }
    } else {
      console.warn('Error caching data:', error);
    }
  }
};

/**
 * Clear old cache entries to free up space
 */
const clearOldCacheEntries = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;

    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (now - entry.timestamp > entry.ttl) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch (e) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    if (cleared > 0) {
      console.log(`Cleared ${cleared} expired cache entries`);
    }
  } catch (error) {
    console.warn('Error clearing old cache entries:', error);
  }
};

/**
 * Clear all cache entries
 */
export const clearCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
};

/**
 * Clear cache for a specific endpoint
 */
export const clearCacheForEndpoint = (endpoint: string, params?: Record<string, any>): void => {
  const key = getCacheKey(endpoint, params);
  localStorage.removeItem(key);
};

/**
 * Debounce function for search/filter operations
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for scroll/resize events
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

