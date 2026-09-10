import { Router } from 'express';
import { db } from '../config/db.js';
import { goals, marathons, donations, workspaces } from '../db/schema.js';
import { eq, desc, sum, count, sql } from 'drizzle-orm';

const router = Router();

// GET /api/embed/goal/:id
router.get('/goal/:id', async (req, res, next) => {
  try {
    const goalList = await db
      .select({
        goal: goals,
        theme: workspaces.theme,
      })
      .from(goals)
      .innerJoin(workspaces, eq(goals.workspaceId, workspaces.id))
      .where(eq(goals.id, String(req.params.id)))
      .limit(1);

    if (goalList.length === 0) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    res.json({ goal: goalList[0].goal, theme: goalList[0].theme });
  } catch (err) {
    next(err);
  }
});

// GET /api/embed/marathon/:id
router.get('/marathon/:id', async (req, res, next) => {
  try {
    const marathonList = await db
      .select({
        marathon: marathons,
        theme: workspaces.theme,
      })
      .from(marathons)
      .innerJoin(workspaces, eq(marathons.workspaceId, workspaces.id))
      .where(eq(marathons.id, String(req.params.id)))
      .limit(1);

    if (marathonList.length === 0) {
      res.status(404).json({ error: 'Marathon not found' });
      return;
    }

    res.json({ marathon: marathonList[0].marathon, theme: marathonList[0].theme });
  } catch (err) {
    next(err);
  }
});

// GET /api/embed/leaderboard/:workspaceId
router.get('/leaderboard/:workspaceId', async (req, res, next) => {
  try {
    const wsList = await db.select({ theme: workspaces.theme }).from(workspaces).where(eq(workspaces.id, String(req.params.workspaceId))).limit(1);
    if (wsList.length === 0) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    const entries = await db
      .select({
        donorName: donations.donorName,
        totalAmount: sql<number>`cast(sum(${donations.amount}) as int)`,
        donationCount: sql<number>`cast(count(${donations.id}) as int)`,
        lastDonatedAt: sql<string>`max(${donations.createdAt})`,
      })
      .from(donations)
      .where(eq(donations.workspaceId, String(req.params.workspaceId)))
      .groupBy(donations.donorName)
      .orderBy(desc(sql`sum(${donations.amount})`))
      .limit(10);

    res.json({ entries, theme: wsList[0].theme });
  } catch (err) {
    next(err);
  }
});

// GET /api/embed/workspace-by-slug/:slug
router.get('/workspace-by-slug/:slug', async (req, res, next) => {
  try {
    const wsList = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        theme: workspaces.theme,
      })
      .from(workspaces)
      .where(eq(workspaces.slug, String(req.params.slug)))
      .limit(1);

    if (wsList.length === 0) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json({ workspace: wsList[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
