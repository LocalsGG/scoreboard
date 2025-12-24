"use client";

import { useEffect, useState } from "react";
import { cache } from "../cache";
import { preloadImage } from "../image-cache";

/**
 * React hook for cached image loading
 */
export function useCachedImage(url: string | null | undefined): string | null {
  if (typeof window === "undefined" || !url) return url || null;

  const [cachedUrl, setCachedUrl] = useState<string | null>(url);

  useEffect(() => {
    if (!url) return;

    // Capture url in a const so TypeScript knows it's defined
    const imageUrl: string = url;
    let cancelled = false;

    async function loadImage() {
      const cached = await cache.images.get(imageUrl);
      if (cached && !cancelled) {
        setCachedUrl(cached);
      } else if (!cancelled) {
        // Preload in background
        preloadImage(imageUrl).then(() => {
          if (!cancelled) {
            cache.images.get(imageUrl).then((cached) => {
              if (cached && !cancelled) {
                setCachedUrl(cached);
              }
            });
          }
        });
      }
    }

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return cachedUrl;
}

