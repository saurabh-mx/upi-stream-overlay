import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspaceMember, requireOwner, requirePermission } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createWidgetSchema, updateWidgetSchema } from '@upi-stream/shared';
import * as widgetService from '../services/widget.service.js';
import { logAuditAction } from '../services/audit.service.js';

const router = Router({ mergeParams: true }); // mergeParams to access :wid

// POST /api/workspaces/:wid/widgets
router.post('/', authenticate, requireWorkspaceMember(), requireOwner(), validate(createWidgetSchema), async (req, res, next) => {
  try {
    const widget = await widgetService.createWidget(String(req.params.wid), req.body);
    await logAuditAction(String(req.params.wid), req.user!.userId, 'WIDGET_CREATED', widget.id, { type: widget.type });
    res.status(201).json({ widget });
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:wid/widgets
router.get('/', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const widgets = await widgetService.getWidgetsForWorkspace(String(req.params.wid));
    res.json({ widgets });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/workspaces/:wid/widgets/:widgetId
router.patch('/:widgetId', authenticate, requireWorkspaceMember(), requireOwner(), validate(updateWidgetSchema), async (req, res, next) => {
  try {
    const widget = await widgetService.updateWidget(String(req.params.widgetId), req.body);
    await logAuditAction(String(req.params.wid), req.user!.userId, 'WIDGET_UPDATED', widget.id);
    res.json({ widget });
  } catch (err) {
    next(err);
  }
});

export default router;
