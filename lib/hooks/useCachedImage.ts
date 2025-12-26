"use client";

import { useEffect, useState } from "react";

/**
 * Simple React hook for image preloading
 */
export function useCachedImage(url: string | null | undefined): string | null {
  if (typeof window === "undefined" || !url) return url || null;

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!url || loaded) return;

    // Simple preloading - just create an Image object
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = url;

    return () => {
      // Cleanup not needed for simple preloading
    };
  }, [url, loaded]);

  return url;
}

