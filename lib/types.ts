// Common types used throughout the application

export interface ScoreboardRow {
  id: string;
  name: string | null;
  share_token: string | null;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  a_side: string | null;
  b_side: string | null;
  a_score: number | null;
  b_score: number | null;
}

export interface User {
  id: string;
  email: string;
}

// Auth related types
export type AuthMode = 'signin' | 'signup';
export type AuthView = 'form' | 'reset';
export type OAuthProvider = 'google' | 'discord' | 'anonymous';

export interface AuthStatus {
  type: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

// Component props types
export interface ScoreboardPreviewProps {
  boardId: string;
  initialName: string | null;
  initialASide: string | null;
  initialBSide: string | null;
  initialAScore: number | null;
  initialBScore: number | null;
  initialUpdatedAt: string | null;
}

