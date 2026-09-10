import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspaceMember, requireOwner, requirePermission } from '../middleware/rbac.js';
import * as donationService from '../services/donation.service.js';
import { logAuditAction } from '../services/audit.service.js';

const router = Router({ mergeParams: true });

// GET /api/workspaces/:wid/donations
router.get('/', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = Math.min(parseInt(String(req.query.limit)) || 50, 100);
    const result = await donationService.getDonationsForWorkspace(String(req.params.wid), page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/workspaces/:wid/donations/stats
router.get('/stats', authenticate, requireWorkspaceMember(), async (req, res, next) => {
  try {
    const stats = await donationService.getLeaderboard(String(req.params.wid), 10, 'all');
    res.json({ leaderboard: stats });
  } catch (err) {
    next(err);
  }
});

// POST /api/workspaces/:wid/donations/simulate (For testing overlays)
router.post('/simulate', authenticate, requireWorkspaceMember(), requireOwner(), async (req, res, next) => {
  try {
    const { amount, currency, donorName, message } = req.body;
    if (!amount || !donorName) {
      res.status(400).json({ error: 'Amount and donor name required' });
      return;
    }
    const donation = await donationService.createDonation(String(req.params.wid), {
      amount,
      currency: currency || 'INR',
      donorName,
      message,
    });
    await logAuditAction(String(req.params.wid), req.user!.userId, 'DONATION_SIMULATED', donation.id, { amount, donorName });
    res.status(201).json({ donation });
  } catch (err) {
    next(err);
  }
});

export default router;
