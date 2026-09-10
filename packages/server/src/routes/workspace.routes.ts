import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspaceMember, requireOwner } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema, updateMemberPermissionsSchema } from '@upi-stream/shared';
import * as workspaceService from '../services/workspace.service.js';
import { getAuditLogs, logAuditAction } from '../services/audit.service.js';
import { getWorkspaceAnalytics } from '../services/analytics.service.js';

const router = Router();

// POST /api/workspaces — Create workspace
router.post('/', authenticate, validate(createWorkspaceSchema), async (req, res, next) => {
  try {
    const workspace = await workspaceService.createWorkspace(
      req.user!.userId,
      req.body.name,
      req.body.theme
    );
    res.status(201).json({ workspace });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces — List my workspaces
router.get('/', authenticate, async (req, res, next) => {
  try {
    const workspaces = await workspaceService.getWorkspacesForUser(req.user!.userId);
    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:wid — Get workspace details
router.get('/:wid', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(String(req.params.wid));
    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:wid — Update workspace
router.patch('/:wid', authenticate, requireWorkspaceMember(), requireOwner(), validate(updateWorkspaceSchema), async (req, res, next) => {
  try {
    const workspace = await workspaceService.updateWorkspace(String(req.params.wid), req.body);
    res.json({ workspace });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workspaces/:wid — Delete workspace
router.delete('/:wid', authenticate, requireWorkspaceMember(), requireOwner(), async (req, res, next) => {
  try {
    await workspaceService.deleteWorkspace(String(req.params.wid));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/join — Join via invite code
router.post('/join', authenticate, async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      res.status(400).json({ error: 'Invite code is required' });
      return;
    }
    const result = await workspaceService.joinWorkspaceByCode(req.user!.userId, inviteCode);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:wid/members/:mid/permissions — Update moderator permissions
router.patch(
  '/:wid/members/:mid/permissions',
  authenticate,
  requireWorkspaceMember(),
  requireOwner(),
  validate(updateMemberPermissionsSchema),
  async (req, res, next) => {
    try {
      const member = await workspaceService.updateModeratorPermissions(
        String(req.params.wid),
        String(req.params.mid),
        req.body
      );
      await logAuditAction(String(req.params.wid), req.user!.userId, 'MEMBER_PERMISSIONS_UPDATED', String(req.params.mid), { permissions: req.body });
      res.json({ member });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/workspaces/:wid/members/:mid — Remove member
router.delete(
  '/:wid/members/:mid',
  authenticate,
  requireWorkspaceMember(),
  requireOwner(),
  async (req, res, next) => {
    try {
      await workspaceService.removeMember(String(req.params.wid), String(req.params.mid));
      await logAuditAction(String(req.params.wid), req.user!.userId, 'MEMBER_REMOVED', String(req.params.mid));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/workspaces/:wid/audit-logs
router.get('/:wid/audit-logs', authenticate, requireWorkspaceMember(), requireOwner(), async (req, res, next) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = Math.min(parseInt(String(req.query.limit)) || 50, 100);
    const logs = await getAuditLogs(String(req.params.wid), page, limit);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:wid/analytics
router.get('/:wid/analytics', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const analytics = await getWorkspaceAnalytics(String(req.params.wid));
    res.json({ analytics });
  } catch (err) {
    next(err);
  }
});

export default router;
