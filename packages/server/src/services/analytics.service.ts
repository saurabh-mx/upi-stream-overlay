import { db } from '../config/db.js';
import { donations } from '../db/schema.js';
import { eq, sql, and, gte } from 'drizzle-orm';

export async function getWorkspaceAnalytics(workspaceId: string) {
  // Get donations over the last 30 days grouped by day
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Group by date (YYYY-MM-DD)
  const donationsOverTime = await db
    .select({
      date: sql<string>`TO_CHAR(${donations.createdAt}, 'YYYY-MM-DD')`,
      amount: sql<number>`SUM(${donations.amount})::int`,
    })
    .from(donations)
    .where(
      and(
        eq(donations.workspaceId, workspaceId),
        eq(donations.status, 'completed'),
        gte(donations.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`TO_CHAR(${donations.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${donations.createdAt}, 'YYYY-MM-DD')`);

  // Top 5 donors
  const topDonors = await db
    .select({
      name: donations.donorName,
      value: sql<number>`SUM(${donations.amount})::int`,
    })
    .from(donations)
    .where(
      and(
        eq(donations.workspaceId, workspaceId),
        eq(donations.status, 'completed')
      )
    )
    .groupBy(donations.donorName)
    .orderBy(sql`SUM(${donations.amount}) DESC`)
    .limit(5);

  return {
    donationsOverTime,
    topDonors,
  };
}
