const SUPABASE_PUBLIC_IMAGE_BASE =
  "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images";

export const HERO_SCOREBOARD_IMAGES = [
  `${SUPABASE_PUBLIC_IMAGE_BASE}/scoreboard1.svg`,
  `${SUPABASE_PUBLIC_IMAGE_BASE}/scoreboard2.svg`,
  `${SUPABASE_PUBLIC_IMAGE_BASE}/scoreboard3.svg`,
];

export const SCOREBOARD_OVERLAY_IMAGE = `${SUPABASE_PUBLIC_IMAGE_BASE}/scoreboard1.svg`;

export const TOURNAMENT_EXAMPLE_IMAGE = `${SUPABASE_PUBLIC_IMAGE_BASE}/tournamentexample.png`;

// Game configuration mapping
const GAME_CONFIGS = {
  melee: {
    displayName: "Super Smash Bros. Melee",
    icon: "melee-icon.svg",
    keywords: ["melee"],
  },
  ultimate: {
    displayName: "Super Smash Bros. Ultimate",
    icon: "ultimate-icon.svg",
    keywords: ["ultimate"],
  },
  "guilty-gear": {
    displayName: "Guilty Gear Strive",
    icon: "guilty-icon.svg",
    keywords: ["guilty gear", "strive"],
  },
  generic: {
    displayName: "Generic",
    icon: "logo.svg",
    keywords: ["generic"],
  },
} as const;

/**
 * Gets the game name from the board name.
 * Extracts the recognized game name from the board name string.
 */
export function getGameName(boardName: string | null): string {
  if (!boardName) {
    return GAME_CONFIGS.generic.displayName;
  }

  const name = boardName.toLowerCase();

  for (const [, config] of Object.entries(GAME_CONFIGS)) {
    if (config.keywords.some(keyword => name.includes(keyword))) {
      return config.displayName;
    }
  }

  // Default fallback - return generic display name
  return GAME_CONFIGS.generic.displayName;
}

/**
 * Gets the game icon URL based on the board name.
 * Maps game names to their corresponding icon files.
 */
export function getGameIcon(boardName: string | null): string {
  if (!boardName) {
    return `${SUPABASE_PUBLIC_IMAGE_BASE}/${GAME_CONFIGS.generic.icon}`;
  }

  const name = boardName.toLowerCase();

  for (const [, config] of Object.entries(GAME_CONFIGS)) {
    if (config.keywords.some(keyword => name.includes(keyword))) {
      return `${SUPABASE_PUBLIC_IMAGE_BASE}/${config.icon}`;
    }
  }

  // Default fallback
  return `${SUPABASE_PUBLIC_IMAGE_BASE}/${GAME_CONFIGS.generic.icon}`;
}

/**
 * Checks if the board is a Super Smash Bros game (Melee or Ultimate).
 * Returns true only for Smash Bros games, false for others.
 */
export function isSmashBrosGame(boardName: string | null): boolean {
  if (!boardName) {
    return false;
  }

  const name = boardName.toLowerCase();
  
  // Check if it's melee or ultimate
  return (
    GAME_CONFIGS.melee.keywords.some(keyword => name.includes(keyword)) ||
    GAME_CONFIGS.ultimate.keywords.some(keyword => name.includes(keyword))
  );
}
