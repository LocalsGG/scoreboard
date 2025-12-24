/**
 * Image caching utilities using Cache API and IndexedDB
 */

import { cache } from "./cache";

/**
 * Preload and cache an image
 */
export async function preloadImage(url: string): Promise<void> {
  if (typeof window === "undefined") return;

  // Check if already cached
  const cached = await cache.images.get(url);
  if (cached) return;

  try {
    // Fetch image
    const response = await fetch(url, {
      mode: "cors",
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Store in IndexedDB
    await cache.images.set(url, blob);

    // Also cache the response
    await cache.responses.set(url, response);
  } catch (error) {
    console.warn(`Failed to preload image ${url}:`, error);
  }
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  // Preload in parallel (but limit concurrency)
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((url) => preloadImage(url)));
  }
}

/**
 * Get cached image URL or fetch and cache
 */
export async function getCachedImageUrl(url: string): Promise<string> {
  if (typeof window === "undefined") return url;

  // Check cache first
  const cached = await cache.images.get(url);
  if (cached) {
    return cached;
  }

  // If not cached, return original URL (browser will cache it)
  // Optionally preload in background
  preloadImage(url).catch(console.warn);

  return url;
}


