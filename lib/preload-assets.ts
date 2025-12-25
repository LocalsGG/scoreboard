/**
 * Preload common assets for better performance
 */

import { preloadImages } from "./image-cache";
import { getSupabaseStorageUrl } from "./assets";

/**
 * Preload common scoreboard assets
 */
export async function preloadCommonAssets(): Promise<void> {
  if (typeof window === "undefined") return;

  const baseUrl = getSupabaseStorageUrl();
  const commonAssets = [
    `${baseUrl}/scoreboard1.svg`,
    `${baseUrl}/scoreboard2.svg`,
    `${baseUrl}/scoreboard3.svg`,
    `${baseUrl}/logo.svg`,
    `${baseUrl}/melee-icon.svg`,
    `${baseUrl}/ultimate-icon.svg`,
    `${baseUrl}/guilty-icon.svg`,
  ];

  // Preload in background (don't block)
  preloadImages(commonAssets).catch(console.warn);
}

/**
 * Preload character icons (call after characters are loaded)
 */
export async function preloadCharacterIcons(
  characterUrls: string[]
): Promise<void> {
  if (typeof window === "undefined" || characterUrls.length === 0) return;

  // Preload first 20 characters immediately, rest in background
  const priority = characterUrls.slice(0, 20);
  const rest = characterUrls.slice(20);

  // Preload priority images
  await preloadImages(priority).catch(console.warn);

  // Preload rest in background
  if (rest.length > 0) {
    setTimeout(() => {
      preloadImages(rest).catch(console.warn);
    }, 1000);
  }
}

/**
 * Initialize asset preloading on app load
 */
export function initAssetPreloading(): void {
  if (typeof window === "undefined") return;

  // Preload common assets after a short delay to not block initial render
  setTimeout(() => {
    preloadCommonAssets().catch(console.warn);
  }, 2000);
}



