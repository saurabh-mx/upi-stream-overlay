import type { Request, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { workspaceMembers, workspaces } from '../db/schema.js';
import type { ModeratorPermissions } from '@upi-stream/shared';

/**
 * Require the authenticated user to be a member of the workspace
 * identified by `req.params.wid`. Sets `req.workspaceMember`.
 */
export function requireWorkspaceMember() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const wid = String(req.params.wid);
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admins bypass membership check
    if (req.user!.role === 'admin') {
      req.workspaceMember = { id: 'admin', role: 'owner', permissions: null };
      next();
      return;
    }

    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, wid),
        eq(workspaceMembers.userId, userId)
      ),
    });

    if (!member) {
      res.status(403).json({ error: 'You are not a member of this workspace' });
      return;
    }

    req.workspaceMember = {
      id: member.id,
      role: member.role,
      permissions: member.permissions as ModeratorPermissions | null,
    };
    next();
  };
}

/**
 * Require workspace owner role. Must be used after requireWorkspaceMember().
 */
export function requireOwner() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role === 'admin') {
      next();
      return;
    }

    if (req.workspaceMember?.role !== 'owner') {
      res.status(403).json({ error: 'Only the workspace owner can perform this action' });
      return;
    }
    next();
  };
}

/**
 * Require a specific moderator permission. Must be used after requireWorkspaceMember().
 * Owners always pass. Moderators must have the permission granted.
 */
export function requirePermission(permission: keyof ModeratorPermissions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role === 'admin') {
      next();
      return;
    }

    const member = req.workspaceMember;
    if (!member) {
      res.status(403).json({ error: 'Workspace membership required' });
      return;
    }

    // Owners always have all permissions
    if (member.role === 'owner') {
      next();
      return;
    }

    // Moderators need explicit permission
    if (member.permissions && member.permissions[permission]) {
      next();
      return;
    }

    res.status(403).json({
      error: `You don't have the '${permission}' permission in this workspace`,
    });
  };
}
