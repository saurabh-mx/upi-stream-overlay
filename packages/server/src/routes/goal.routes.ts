import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspaceMember, requireOwner, requirePermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createGoalSchema, updateGoalSchema } from '@upi-stream/shared';
import * as goalService from '../services/goal.service.js';
import { logAuditAction } from '../services/audit.service.js';

const router = Router({ mergeParams: true }); // mergeParams to access :wid

// POST /api/workspaces/:wid/goals
router.post('/', authenticate, requireWorkspaceMember(), requireOwner(), validate(createGoalSchema), async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(String(req.params.wid), req.body);
    await logAuditAction(String(req.params.wid), req.user!.userId, 'GOAL_CREATED', goal.id, { title: goal.title });
    res.status(201).json({ goal });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:wid/goals
router.get('/', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const goals = await goalService.getGoalsForWorkspace(String(req.params.wid));
    res.json({ goals });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:wid/goals/:gid
router.patch('/:gid', authenticate, requireWorkspaceMember(), requirePermission('canUpdateGoals'), validate(updateGoalSchema), async (req, res, next) => {
  try {
    const goal = await goalService.updateGoal(String(req.params.gid), req.body);
    await logAuditAction(String(req.params.wid), req.user!.userId, 'GOAL_UPDATED', goal.id, { updates: req.body });
    res.json({ goal });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/workspaces/:wid/goals/:gid
router.delete('/:gid', authenticate, requireWorkspaceMember(), requireOwner(), async (req, res, next) => {
  try {
    await goalService.deleteGoal(String(req.params.gid));
    await logAuditAction(String(req.params.wid), req.user!.userId, 'GOAL_DELETED', String(req.params.gid));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
