"use client";

import { useEffect } from "react";
import { initAssetPreloading } from "@/lib/preload-assets";

/**
 * Client component that initializes asset preloading
 * Should be included in the root layout
 */
export function AssetPreloader() {
  useEffect(() => {
    initAssetPreloading();
  }, []);

  return null;
}

