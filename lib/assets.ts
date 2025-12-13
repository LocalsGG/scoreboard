const supabasePublicImageBase =
  "https://xhfowpcbsriitbtxmjob.supabase.co/storage/v1/object/public/public%20images";

export const HERO_SCOREBOARD_IMAGES = [
  `${supabasePublicImageBase}/scoreboard1.svg`,
  `${supabasePublicImageBase}/scoreboard2.svg`,
  `${supabasePublicImageBase}/scoreboard3.svg`,
];

export const SCOREBOARD_OVERLAY_IMAGE = `${supabasePublicImageBase}/scoreboard1.svg`;

export const TOURNAMENT_EXAMPLE_IMAGE = `${supabasePublicImageBase}/tournamentexample.png`;

/**
 * Gets the game name from the board name.
 * Extracts the recognized game name from the board name string.
 */
export function getGameName(boardName: string | null): string {
  if (!boardName) {
    return "Generic";
  }

  const name = boardName.toLowerCase();

  if (name.includes("melee")) {
    return "Super Smash Bros. Melee";
  }
  if (name.includes("ultimate")) {
    return "Super Smash Bros. Ultimate";
  }
  if (name.includes("guilty gear") || name.includes("strive")) {
    return "Guilty Gear Strive";
  }
  if (name.includes("generic")) {
    return "Generic";
  }

  // Default fallback - return the board name itself
  return boardName;
}

/**
 * Gets the game icon URL based on the board name.
 * Maps game names to their corresponding icon files.
 */
export function getGameIcon(boardName: string | null): string {
  if (!boardName) {
    return `${supabasePublicImageBase}/logo.svg`;
  }

  const name = boardName.toLowerCase();

  if (name.includes("melee")) {
    return `${supabasePublicImageBase}/melee-icon.svg`;
  }
  if (name.includes("ultimate")) {
    return `${supabasePublicImageBase}/ultimate-icon.svg`;
  }
  if (name.includes("guilty gear") || name.includes("strive")) {
    return `${supabasePublicImageBase}/guilty-icon.svg`;
  }
  if (name.includes("generic")) {
    return `${supabasePublicImageBase}/logo.svg`;
  }

  // Default fallback
  return `${supabasePublicImageBase}/logo.svg`;
}
