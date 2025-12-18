import type { ElementPositions, ScoreboardType } from "@/lib/types";
import { getDefaultPositions } from "./gameConfigs";

export const DEFAULT_POSITIONS: ElementPositions = {
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

export function getDefaultPositionsForType(type: ScoreboardType | null): ElementPositions {
  return getDefaultPositions(type);
}

// Merge positions with defaults to ensure logo position exists and fontSize is set
export function getMergedPositions(
  positions: ElementPositions | null | undefined,
  type?: ScoreboardType | null
): ElementPositions {
  const defaults = type ? getDefaultPositionsForType(type) : DEFAULT_POSITIONS;
  if (!positions) return defaults;
  
  const merged = { ...defaults, ...positions };
  // Ensure logo exists and has all required properties
  if (!merged.logo) {
    merged.logo = defaults.logo;
  } else {
    merged.logo = {
      x: merged.logo.x ?? defaults.logo.x ?? 720,
      y: merged.logo.y ?? defaults.logo.y ?? 405,
      width: merged.logo.width ?? defaults.logo.width ?? 64,
      height: merged.logo.height ?? defaults.logo.height ?? 64,
    };
  }
  // Ensure fontSize is set for text elements
  if (merged.title && !merged.title.fontSize) {
    merged.title.fontSize = defaults.title.fontSize ?? 72;
  }
  if (merged.subtitle && !merged.subtitle.fontSize) {
    merged.subtitle.fontSize = defaults.subtitle?.fontSize ?? 48;
  }
  if (merged.a_side && !merged.a_side.fontSize) {
    merged.a_side.fontSize = defaults.a_side.fontSize ?? 60;
  }
  if (merged.b_side && !merged.b_side.fontSize) {
    merged.b_side.fontSize = defaults.b_side.fontSize ?? 60;
  }
  if (merged.a_score && !merged.a_score.fontSize) {
    merged.a_score.fontSize = defaults.a_score.fontSize ?? 110;
  }
  if (merged.b_score && !merged.b_score.fontSize) {
    merged.b_score.fontSize = defaults.b_score.fontSize ?? 110;
  }
  // Ensure icon sizes are set
  if (merged.a_side_icon && (!merged.a_side_icon.width || !merged.a_side_icon.height)) {
    merged.a_side_icon = {
      ...merged.a_side_icon,
      width: merged.a_side_icon.width ?? defaults.a_side_icon?.width ?? 64,
      height: merged.a_side_icon.height ?? defaults.a_side_icon?.height ?? 64,
    };
  }
  if (merged.b_side_icon && (!merged.b_side_icon.width || !merged.b_side_icon.height)) {
    merged.b_side_icon = {
      ...merged.b_side_icon,
      width: merged.b_side_icon.width ?? defaults.b_side_icon?.width ?? 64,
      height: merged.b_side_icon.height ?? defaults.b_side_icon?.height ?? 64,
    };
  }
  return merged;
}

export const DEBOUNCE_MS = 400;

export const DEFAULT_CENTER_TEXT_COLOR = "#f8fafc";


