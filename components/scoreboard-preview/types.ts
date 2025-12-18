import type { ElementPositions, ScoreboardPreviewProps, ScoreboardType } from "@/lib/types";

export type PreviewProps = ScoreboardPreviewProps;

export interface PreviewState {
  name: string | null;
  subtitle: string | null;
  aSide: string | null;
  bSide: string | null;
  aScore: number;
  bScore: number;
  updatedAt: string | null;
  style: string;
  titleVisible: boolean;
  aSideIcon: string | null;
  bSideIcon: string | null;
  centerTextColor: string;
  customLogoUrl: string | null;
  scoreboardType: ScoreboardType | null;
}

export interface HistorySnapshot {
  positions: ElementPositions;
  state: PreviewState;
}
