"use client";

import { useEffect, useState, useCallback } from "react";
import { cache } from "../cache";

interface UseCachedFetchOptions {
  cacheKey?: string;
  cacheExpiry?: number;
  enabled?: boolean;
  revalidateOnMount?: boolean;
}

interface UseCachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * React hook for fetching data with caching
 */
export function useCachedFetch<T>(
  url: string | null,
  options: UseCachedFetchOptions = {}
): UseCachedFetchResult<T> {
  const {
    cacheKey,
    cacheExpiry = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    revalidateOnMount = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (skipCache = false) => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first (unless skipping)
      if (!skipCache && cacheKey) {
        const cached = cache.getScoreboard(cacheKey);
        if (cached) {
          setData(cached as T);
          setLoading(false);
          
          // Optionally revalidate in background
          if (revalidateOnMount) {
            fetchData(true).catch(console.warn);
          }
          return;
        }
      }

      // Check response cache
      if (!skipCache) {
        const cachedResponse = await cache.responses.get(url);
        if (cachedResponse) {
          const json = await cachedResponse.json();
          setData(json as T);
          setLoading(false);
          if (cacheKey) {
            cache.setScoreboard(cacheKey, json);
          }
          return;
        }
      }

      // Fetch from API
      const response = await fetch(url, {
        cache: "force-cache",
        headers: {
          "Cache-Control": "public, max-age=300", // 5 minutes
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const json = await response.json();
      setData(json as T);

      // Cache the response
      await cache.responses.set(url, response.clone());
      
      // Cache the data
      if (cacheKey) {
        cache.setScoreboard(cacheKey, json);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, cacheExpiry, enabled, revalidateOnMount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
}

