/**
 * Client-side caching utilities for browser storage
 * Supports localStorage for small data and IndexedDB for larger data/images
 */

// Cache configuration
const CACHE_CONFIG = {
  CHARACTERS: {
    key: "scoreboard_characters_cache",
    expiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    storage: "localStorage" as const,
  },
  SCOREBOARDS: {
    key: "scoreboard_data_cache",
    expiry: 5 * 60 * 1000, // 5 minutes
    storage: "localStorage" as const,
  },
  IMAGES: {
    dbName: "scoreboard_images_db",
    storeName: "images",
    version: 1,
    expiry: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
} as const;

type StorageType = "localStorage" | "indexedDB";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

/**
 * Generic cache interface
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
      // If quota exceeded, try to clear old entries
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        this.clearExpired();
        // Retry once
        try {
          localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), expiry }));
          return true;
        } catch {
          return false;
        }
      }
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
   * Clear all expired entries from localStorage
   */
  static clearExpired(): void {
    if (typeof window === "undefined") return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      for (const key of keys) {
        try {
          const cached = localStorage.getItem(key);
          if (!cached) continue;

          const entry = JSON.parse(cached);
          if (entry.timestamp && entry.expiry) {
            if (now - entry.timestamp > entry.expiry) {
              localStorage.removeItem(key);
            }
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
   * Clear all cache entries
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

/**
 * IndexedDB manager for image caching
 */
class ImageCacheManager {
  private static db: IDBDatabase | null = null;
  private static initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB for image caching
   */
  private static async init(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      throw new Error("IndexedDB is only available in browser");
    }

    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(
        CACHE_CONFIG.IMAGES.dbName,
        CACHE_CONFIG.IMAGES.version
      );

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CACHE_CONFIG.IMAGES.storeName)) {
          const store = db.createObjectStore(CACHE_CONFIG.IMAGES.storeName, {
            keyPath: "url",
          });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get image from IndexedDB cache
   * Returns a blob URL that can be used in img src
   */
  static async getImage(url: string): Promise<string | null> {
    if (typeof window === "undefined") return null;

    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([CACHE_CONFIG.IMAGES.storeName], "readonly");
        const store = transaction.objectStore(CACHE_CONFIG.IMAGES.storeName);
        const request = store.get(url);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          const now = Date.now();
          // Check if expired
          if (now - result.timestamp > CACHE_CONFIG.IMAGES.expiry) {
            // Delete expired entry
            this.deleteImage(url).catch(console.warn);
            resolve(null);
            return;
          }

          // Create blob URL from the stored blob
          if (result.blob instanceof Blob) {
            const blobUrl = URL.createObjectURL(result.blob);
            resolve(blobUrl);
          } else {
            // Fallback for old format (if any)
            resolve(null);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`Image cache get error for ${url}:`, error);
      return null;
    }
  }

  /**
   * Store image in IndexedDB cache
   */
  static async setImage(url: string, blob: Blob): Promise<boolean> {
    if (typeof window === "undefined") return false;

    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([CACHE_CONFIG.IMAGES.storeName], "readwrite");
        const store = transaction.objectStore(CACHE_CONFIG.IMAGES.storeName);

        // Store the blob directly (IndexedDB can store Blob objects)
        const entry = {
          url,
          blob: blob, // Store the actual blob
          timestamp: Date.now(),
        };

        const request = store.put(entry);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`Image cache set error for ${url}:`, error);
      return false;
    }
  }

  /**
   * Delete image from cache
   */
  static async deleteImage(url: string): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([CACHE_CONFIG.IMAGES.storeName], "readwrite");
        const store = transaction.objectStore(CACHE_CONFIG.IMAGES.storeName);
        const request = store.delete(url);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`Image cache delete error for ${url}:`, error);
    }
  }

  /**
   * Clear all expired images from cache
   */
  static async clearExpired(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([CACHE_CONFIG.IMAGES.storeName], "readwrite");
        const store = transaction.objectStore(CACHE_CONFIG.IMAGES.storeName);
        const index = store.index("timestamp");
        const now = Date.now();
        const range = IDBKeyRange.upperBound(now - CACHE_CONFIG.IMAGES.expiry);

        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn("Error clearing expired images:", error);
    }
  }
}

/**
 * Cache API wrapper for HTTP responses (Service Worker alternative)
 */
class ResponseCache {
  private static cacheName = "scoreboard-api-cache-v1";

  /**
   * Get cached response
   */
  static async get(url: string): Promise<Response | null> {
    if (typeof window === "undefined" || !("caches" in window)) return null;

    try {
      const cache = await caches.open(this.cacheName);
      const cached = await cache.match(url);
      return cached || null;
    } catch (error) {
      console.warn(`Response cache get error for ${url}:`, error);
      return null;
    }
  }

  /**
   * Store response in cache
   */
  static async set(url: string, response: Response): Promise<boolean> {
    if (typeof window === "undefined" || !("caches" in window)) return false;

    try {
      const cache = await caches.open(this.cacheName);
      await cache.put(url, response.clone());
      return true;
    } catch (error) {
      console.warn(`Response cache set error for ${url}:`, error);
      return false;
    }
  }

  /**
   * Delete cached response
   */
  static async delete(url: string): Promise<void> {
    if (typeof window === "undefined" || !("caches" in window)) return;

    try {
      const cache = await caches.open(this.cacheName);
      await cache.delete(url);
    } catch (error) {
      console.warn(`Response cache delete error for ${url}:`, error);
    }
  }
}

/**
 * Public API for caching
 */
export const cache = {
  /**
   * Get characters from cache
   */
  getCharacters: () =>
    CacheManager.get<Array<{ name: string; url: string }>>(
      CACHE_CONFIG.CHARACTERS.key,
      CACHE_CONFIG.CHARACTERS.expiry
    ),

  /**
   * Set characters in cache
   */
  setCharacters: (characters: Array<{ name: string; url: string }>) =>
    CacheManager.set(
      CACHE_CONFIG.CHARACTERS.key,
      characters,
      CACHE_CONFIG.CHARACTERS.expiry
    ),

  /**
   * Get scoreboard data from cache
   */
  getScoreboard: (boardId: string) =>
    CacheManager.get<any>(`${CACHE_CONFIG.SCOREBOARDS.key}_${boardId}`, CACHE_CONFIG.SCOREBOARDS.expiry),

  /**
   * Set scoreboard data in cache
   */
  setScoreboard: (boardId: string, data: any) =>
    CacheManager.set(`${CACHE_CONFIG.SCOREBOARDS.key}_${boardId}`, data, CACHE_CONFIG.SCOREBOARDS.expiry),

  /**
   * Image caching
   */
  images: {
    get: ImageCacheManager.getImage.bind(ImageCacheManager),
    set: ImageCacheManager.setImage.bind(ImageCacheManager),
    delete: ImageCacheManager.deleteImage.bind(ImageCacheManager),
    clearExpired: ImageCacheManager.clearExpired.bind(ImageCacheManager),
  },

  /**
   * Response caching
   */
  responses: {
    get: ResponseCache.get.bind(ResponseCache),
    set: ResponseCache.set.bind(ResponseCache),
    delete: ResponseCache.delete.bind(ResponseCache),
  },

  /**
   * Utility methods
   */
  clearExpired: () => {
    CacheManager.clearExpired();
    ImageCacheManager.clearExpired().catch(console.warn);
  },
  clearAll: CacheManager.clearAll,
};

// Clean up expired cache on load (non-blocking)
if (typeof window !== "undefined") {
  // Run cleanup after a short delay to not block initial render
  setTimeout(() => {
    cache.clearExpired();
  }, 1000);
}

