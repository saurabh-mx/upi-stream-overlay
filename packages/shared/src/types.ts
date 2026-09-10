// ─── User ────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'admin' | 'user';
  totpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface WorkspaceTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  upiId?: string;
  donationMessage?: string;
}

export const DEFAULT_WORKSPACE_THEME: WorkspaceTheme = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#1e1b4b',
  accentColor: '#06b6d4',
  backgroundColor: '#0f0f23',
  textColor: '#e2e8f0',
  fontFamily: 'Inter',
};

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  theme: WorkspaceTheme;
  createdAt: string;
  updatedAt: string;
}

// ─── Workspace Member ────────────────────────────────────
import type { ModeratorPermissions, WorkspaceRole } from './roles.js';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  permissions: ModeratorPermissions | null;
  joinedAt: string;
  user?: UserPublic;
}

// ─── Goal ────────────────────────────────────────────────
export type GoalDisplayType = 'bar' | 'circle' | 'animated';

export interface GoalStyleConfig {
  primaryColor: string;
  secondaryColor: string;
  animation: 'pulse' | 'glow' | 'fill' | 'none';
  fontSize: number;
}

export const DEFAULT_GOAL_STYLE: GoalStyleConfig = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#1e1b4b',
  animation: 'fill',
  fontSize: 16,
};

export interface Goal {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  displayType: GoalDisplayType;
  styleConfig: GoalStyleConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Marathon ────────────────────────────────────────────
export type MarathonStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface MarathonRules {
  /** Mapping of donation amount (in smallest unit) to bonus seconds */
  donationToTime: Record<number, number>;
}

export interface Marathon {
  id: string;
  workspaceId: string;
  title: string;
  durationSeconds: number;
  elapsedSeconds: number;
  bonusSeconds: number;
  status: MarathonStatus;
  startedAt: string | null;
  endsAt: string | null;
  rules: MarathonRules;
  createdAt: string;
  updatedAt: string;
}

// ─── Donation ────────────────────────────────────────────
export type DonationStatus = 'pending' | 'completed' | 'refunded';

export interface Donation {
  id: string;
  workspaceId: string;
  marathonId: string | null;
  goalId: string | null;
  donorName: string;
  donorEmail: string | null;
  amount: number;
  currency: string;
  message: string | null;
  status: DonationStatus;
  paymentRef: string | null;
  createdAt: string;
}

// ─── Leaderboard Entry ──────────────────────────────────
export interface LeaderboardEntry {
  donorName: string;
  totalAmount: number;
  donationCount: number;
  lastDonatedAt: string;
}

// ─── Widget ──────────────────────────────────────────────
export type WidgetType = 'goal' | 'marathon' | 'leaderboard' | 'ticker';

export interface WidgetConfig {
  width: number;
  height: number;
  themeOverrides?: Partial<WorkspaceTheme>;
  targetId?: string;
}

export interface Widget {
  id: string;
  workspaceId: string;
  type: WidgetType;
  embedToken: string;
  config: WidgetConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth Responses ──────────────────────────────────────
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
}
