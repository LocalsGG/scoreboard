/**
 * Simple image preloading utilities
 */

/**
 * Preload a single image
 */
export async function preloadImage(url: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const img = new Image();
    img.src = url;
    // Let browser handle caching naturally
  } catch (error) {
    console.warn(`Failed to preload image ${url}:`, error);
  }
}

/**
 * Preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  if (typeof window === "undefined") return;

  // Preload in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((url) => preloadImage(url)));
  }
}

/**
 * Get image URL (no special caching needed - browser handles it)
 */
export function getCachedImageUrl(url: string): string {
  return url;
}


