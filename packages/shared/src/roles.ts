// ─── Global Roles ────────────────────────────────────────
export type GlobalRole = 'admin' | 'user';

// ─── Workspace Roles ─────────────────────────────────────
export type WorkspaceRole = 'owner' | 'moderator';

// ─── Moderator Permissions (JSONB on workspace_members) ──
export interface ModeratorPermissions {
  canAdjustTimer: boolean;
  canManagePayments: boolean;
  canUpdateGoals: boolean;
  canSendAlerts: boolean;
}

export const DEFAULT_MOD_PERMISSIONS: ModeratorPermissions = {
  canAdjustTimer: true,
  canManagePayments: false,
  canUpdateGoals: true,
  canSendAlerts: true,
};

// ─── Permission Check Helpers ────────────────────────────
export function hasModPermission(
  permissions: ModeratorPermissions | null,
  key: keyof ModeratorPermissions
): boolean {
  if (!permissions) return false;
  return permissions[key] === true;
}
