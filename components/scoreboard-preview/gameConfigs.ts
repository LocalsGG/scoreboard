import type { ElementPositions, ScoreboardType } from "@/lib/types";
import { GAME_CONFIGS, getSupabaseStorageUrl } from "@/lib/assets";

const SUPABASE_PUBLIC_IMAGE_BASE = getSupabaseStorageUrl();

// Default positions for each game type
const DEFAULT_POSITIONS_BASE: ElementPositions = {
  title: { x: 720, y: 200, fontSize: 72 },
  subtitle: { x: 720, y: 600, fontSize: 48 },
  logo: { x: 720, y: 405, width: 64, height: 64 },
  a_side: { x: 100, y: 310, fontSize: 60 },
  b_side: { x: 1200, y: 310, fontSize: 60 },
  a_score: { x: 540, y: 400, fontSize: 110 },
  b_score: { x: 910, y: 400, fontSize: 110 },
  a_side_icon: { x: 200, y: 310, width: 64, height: 64 },
  b_side_icon: { x: 1240, y: 310, width: 64, height: 64 },
};

export interface GameConfig {
  defaultPositions: ElementPositions;
  defaultLogo: string;
}

export function getGameConfig(type: ScoreboardType | null): GameConfig {
  const gameType = type || "generic";
  const config = GAME_CONFIGS[gameType];
  
  return {
    defaultPositions: DEFAULT_POSITIONS_BASE,
    defaultLogo: `${SUPABASE_PUBLIC_IMAGE_BASE}/${config.icon}`,
  };
}

export function getDefaultLogo(type: ScoreboardType | null): string {
  return getGameConfig(type).defaultLogo;
}

export function getDefaultPositions(type: ScoreboardType | null): ElementPositions {
  return getGameConfig(type).defaultPositions;
}

