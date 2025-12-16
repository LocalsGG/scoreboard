// Common types used throughout the application

export interface ElementPositions {
  title: { x: number; y: number };
  subtitle?: { x: number; y: number };
  logo: { x: number; y: number };
  a_side: { x: number; y: number };
  b_side: { x: number; y: number };
  a_score: { x: number; y: number };
  b_score: { x: number; y: number };
  a_side_icon?: { x: number; y: number };
  b_side_icon?: { x: number; y: number };
}

export interface ScoreboardRow {
  id: string;
  name: string | null;
  scoreboard_subtitle: string | null;
  share_token: string | null;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  a_side: string | null;
  b_side: string | null;
  a_score: number | null;
  b_score: number | null;
  scoreboard_style: string | null;
  element_positions: ElementPositions | null;
  a_side_icon: string | null;
  b_side_icon: string | null;
}

export interface User {
  id: string;
  email: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Auth related types
export type AuthMode = 'signin' | 'signup';
export type AuthView = 'form' | 'reset';
export type OAuthProvider = 'google';

export interface AuthStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

// Component props types
export interface ScoreboardPreviewProps {
  boardId: string;
  initialName: string | null;
  initialSubtitle?: string | null;
  initialASide: string | null;
  initialBSide: string | null;
  initialAScore: number | null;
  initialBScore: number | null;
  initialUpdatedAt: string | null;
  initialStyle?: string | null;
  initialPositions?: ElementPositions | null;
  initialTitleVisible?: boolean | null;
  initialASideIcon?: string | null;
  initialBSideIcon?: string | null;
  readOnly?: boolean;
}

