import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspaceMember, requireOwner, requirePermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createMarathonSchema } from '@upi-stream/shared';
import * as marathonService from '../services/marathon.service.js';
import { logAuditAction } from '../services/audit.service.js';

const router = Router({ mergeParams: true });

// POST /api/workspaces/:wid/marathons
router.post('/', authenticate, requireWorkspaceMember(), requireOwner(), validate(createMarathonSchema), async (req, res, next) => {
  try {
    const marathon = await marathonService.createMarathon(String(req.params.wid), req.body);
    await logAuditAction(String(req.params.wid), req.user!.userId, 'MARATHON_CREATED', marathon.id, { title: marathon.title });
    res.status(201).json({ marathon });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:wid/marathons
router.get('/', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const marathons = await marathonService.getMarathonsForWorkspace(String(req.params.wid));
    res.json({ marathons });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:wid/marathons/:mid
router.get('/:mid', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const marathon = await marathonService.getMarathonById(String(req.params.mid));
    if (!marathon) {
      res.status(404).json({ error: 'Marathon not found' });
      return;
    }
    res.json({ marathon });
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:wid/marathons/:mid/start
router.post('/:mid/start', authenticate, requireWorkspaceMember(), requirePermission('canAdjustTimer'), async (req, res, next) => {
  try {
    const marathon = await marathonService.startMarathon(String(req.params.mid));
    await logAuditAction(String(req.params.wid), req.user!.userId, 'MARATHON_STARTED', marathon.id);
    res.json({ marathon });
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:wid/marathons/:mid/pause
router.post('/:mid/pause', authenticate, requireWorkspaceMember(), requirePermission('canAdjustTimer'), async (req, res, next) => {
  try {
    const marathon = await marathonService.pauseMarathon(String(req.params.mid));
    await logAuditAction(String(req.params.wid), req.user!.userId, 'MARATHON_PAUSED', marathon.id);
    res.json({ marathon });
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:wid/marathons/:mid/resume
router.post('/:mid/resume', authenticate, requireWorkspaceMember(), requirePermission('canAdjustTimer'), async (req, res, next) => {
  try {
    const marathon = await marathonService.resumeMarathon(String(req.params.mid));
    await logAuditAction(String(req.params.wid), req.user!.userId, 'MARATHON_RESUMED', marathon.id);
    res.json({ marathon });
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:wid/marathons/:mid/bonus
router.post('/:mid/bonus', authenticate, requireWorkspaceMember(), requirePermission('canAdjustTimer'), async (req, res, next) => {
  try {
    const { seconds } = req.body;
    if (!seconds || typeof seconds !== 'number' || seconds <= 0) {
      res.status(400).json({ error: 'Positive seconds value required' });
      return;
    }
    const marathon = await marathonService.addBonusTime(String(req.params.mid), seconds);
    await logAuditAction(String(req.params.wid), req.user!.userId, 'MARATHON_BONUS_ADDED', marathon.id, { seconds });
    res.json({ marathon });
  } catch (err) {
    next(err);
  }
});

export default router;
