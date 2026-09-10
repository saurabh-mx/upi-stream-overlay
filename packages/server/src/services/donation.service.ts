import { eq, sql, desc, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { donations, goals, marathons } from '../db/schema.js';

export async function createDonation(
  workspaceId: string,
  data: {
    donorName: string;
    donorEmail?: string;
    amount: number;
    currency?: string;
    message?: string;
    goalId?: string;
    marathonId?: string;
  }
) {
  const [donation] = await db
    .insert(donations)
    .values({
      workspaceId,
      donorName: data.donorName,
      donorEmail: data.donorEmail || null,
      amount: data.amount,
      currency: data.currency || 'INR',
      message: data.message || null,
      goalId: data.goalId || null,
      marathonId: data.marathonId || null,
      status: 'completed',
    })
    .returning();

  // Update goal progress if linked
  if (data.goalId) {
    await db
      .update(goals)
      .set({
        currentAmount: sql`${goals.currentAmount} + ${data.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, data.goalId));
  }

  // Add bonus time to marathon if linked and rules match
  if (data.marathonId) {
    const marathon = await db.query.marathons.findFirst({
      where: eq(marathons.id, data.marathonId),
    });
    if (marathon && marathon.rules) {
      const rules = marathon.rules as { donationToTime: Record<string, number> };
      // Find the largest matching tier
      const tiers = Object.entries(rules.donationToTime)
        .map(([amount, seconds]) => ({ amount: parseInt(amount), seconds }))
        .sort((a, b) => b.amount - a.amount);

      const matchingTier = tiers.find((t) => data.amount >= t.amount);
      if (matchingTier) {
        const bonusUpdate: Record<string, unknown> = {
          bonusSeconds: sql`${marathons.bonusSeconds} + ${matchingTier.seconds}`,
          updatedAt: new Date(),
        };
        if (marathon.status === 'running' && marathon.endsAt) {
          bonusUpdate.endsAt = new Date(
            new Date(marathon.endsAt).getTime() + matchingTier.seconds * 1000
          );
        }
        await db.update(marathons).set(bonusUpdate).where(eq(marathons.id, data.marathonId));
      }
    }
  }

  return donation;
}

export async function getDonationsForWorkspace(
  workspaceId: string,
  page = 1,
  limit = 20
) {
  const offset = (page - 1) * limit;

  const items = await db.query.donations.findMany({
    where: eq(donations.workspaceId, workspaceId),
    orderBy: (donations, { desc }) => [desc(donations.createdAt)],
    limit,
    offset,
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(donations)
    .where(eq(donations.workspaceId, workspaceId));

  return { donations: items, total: count };
}

export async function deleteDonation(donationId: string) {
  await db.delete(donations).where(eq(donations.id, donationId));
}

// ─── Leaderboard ─────────────────────────────────────────
export async function getLeaderboard(
  workspaceId: string,
  limit = 10,
  period?: 'week' | 'month' | 'all'
) {
  let dateFilter = sql`TRUE`;
  if (period === 'week') {
    dateFilter = sql`${donations.createdAt} >= NOW() - INTERVAL '7 days'`;
  } else if (period === 'month') {
    dateFilter = sql`${donations.createdAt} >= NOW() - INTERVAL '30 days'`;
  }

  return db
    .select({
      donorName: donations.donorName,
      totalAmount: sql<number>`SUM(${donations.amount})::int`.as('total_amount'),
      donationCount: sql<number>`COUNT(*)::int`.as('donation_count'),
      lastDonatedAt: sql<string>`MAX(${donations.createdAt})`.as('last_donated_at'),
    })
    .from(donations)
    .where(
      and(
        eq(donations.workspaceId, workspaceId),
        eq(donations.status, 'completed'),
        dateFilter
      )
    )
    .groupBy(donations.donorName)
    .orderBy(desc(sql`total_amount`))
    .limit(limit);
}
