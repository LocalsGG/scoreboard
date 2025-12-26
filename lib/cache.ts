/**
 * Simple client-side caching utilities using localStorage
 * Simplified version focused on essential data caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Generic localStorage cache manager
 */
class CacheManager {
  /**
   * Get data from localStorage cache
   */
  static get<T>(key: string, expiry: number): T | null {
    if (typeof window === "undefined") return null;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (now - entry.timestamp > expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in localStorage cache
   */
  static set<T>(key: string, data: T, expiry: number): boolean {
    if (typeof window === "undefined") return false;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry,
      };
      localStorage.setItem(key, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.warn(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Remove a cache entry
   */
  static remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Cache remove error for key ${key}:`, error);
    }
  }

  /**
   * Clear expired entries
   */
  static clearExpired(): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      for (const key of keys) {
        if (!key.startsWith("scoreboard_")) continue;

        try {
          const cached = localStorage.getItem(key);
          if (!cached) continue;

          const entry = JSON.parse(cached);
          if (entry.timestamp && entry.expiry && now - entry.timestamp > entry.expiry) {
            localStorage.removeItem(key);
          }
        } catch {
          // Skip invalid entries
        }
      }
    } catch (error) {
      console.warn("Error clearing expired cache:", error);
    }
  }

  /**
   * Clear all scoreboard cache entries
   */
  static clearAll(): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith("scoreboard_")) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn("Error clearing cache:", error);
    }
  }
}

// Cache configuration
const CACHE_CONFIG = {
  CHARACTERS: {
    key: "scoreboard_characters",
    expiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  SCOREBOARD: {
    keyPrefix: "scoreboard_data_",
    expiry: 5 * 60 * 1000, // 5 minutes
  },
} as const;

/**
 * Simple cache API using localStorage
 */
export const cache = {
  /**
   * Get characters from cache (game-type specific)
   */
  getCharacters: (gameType?: string | null) =>
    CacheManager.get<Array<{ name: string; url: string }>>(
      gameType ? `${CACHE_CONFIG.CHARACTERS.key}_${gameType}` : CACHE_CONFIG.CHARACTERS.key,
      CACHE_CONFIG.CHARACTERS.expiry
    ),

  /**
   * Set characters in cache (game-type specific)
   */
  setCharacters: (characters: Array<{ name: string; url: string }>, gameType?: string | null) =>
    CacheManager.set(
      gameType ? `${CACHE_CONFIG.CHARACTERS.key}_${gameType}` : CACHE_CONFIG.CHARACTERS.key,
      characters,
      CACHE_CONFIG.CHARACTERS.expiry
    ),

  /**
   * Get scoreboard data from cache
   */
  getScoreboard: (boardId: string) =>
    CacheManager.get<any>(`${CACHE_CONFIG.SCOREBOARD.keyPrefix}${boardId}`, CACHE_CONFIG.SCOREBOARD.expiry),

  /**
   * Set scoreboard data in cache
   */
  setScoreboard: (boardId: string, data: any) =>
    CacheManager.set(`${CACHE_CONFIG.SCOREBOARD.keyPrefix}${boardId}`, data, CACHE_CONFIG.SCOREBOARD.expiry),

  /**
   * Utility methods
   */
  clearExpired: CacheManager.clearExpired,
  clearAll: CacheManager.clearAll,
};

// Clean up expired cache on load (non-blocking)
if (typeof window !== "undefined") {
  setTimeout(() => {
    cache.clearExpired();
  }, 1000);
}

