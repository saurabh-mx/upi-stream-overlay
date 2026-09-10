import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { marathons } from '../db/schema.js';
import type { MarathonRules } from '@upi-stream/shared';

export async function createMarathon(
  workspaceId: string,
  data: { title: string; durationSeconds: number; rules?: MarathonRules }
) {
  const [marathon] = await db
    .insert(marathons)
    .values({
      workspaceId,
      title: data.title,
      durationSeconds: data.durationSeconds,
      rules: data.rules || { donationToTime: {} },
    })
    .returning();

  return marathon;
}

export async function getMarathonsForWorkspace(workspaceId: string) {
  return db.query.marathons.findMany({
    where: eq(marathons.workspaceId, workspaceId),
    orderBy: (marathons, { desc }) => [desc(marathons.createdAt)],
  });
}

export async function getMarathonById(marathonId: string) {
  return db.query.marathons.findFirst({
    where: eq(marathons.id, marathonId),
  });
}

export async function startMarathon(marathonId: string) {
  const marathon = await db.query.marathons.findFirst({ where: eq(marathons.id, marathonId) });
  if (!marathon) throw Object.assign(new Error('Marathon not found'), { statusCode: 404 });
  if (marathon.status === 'running') throw Object.assign(new Error('Marathon already running'), { statusCode: 400 });
  if (marathon.status === 'finished') throw Object.assign(new Error('Marathon already finished'), { statusCode: 400 });

  const now = new Date();
  const totalSeconds = marathon.durationSeconds + marathon.bonusSeconds - marathon.elapsedSeconds;
  const endsAt = new Date(now.getTime() + totalSeconds * 1000);

  const [updated] = await db
    .update(marathons)
    .set({
      status: 'running',
      startedAt: now,
      endsAt,
      updatedAt: now,
    })
    .where(eq(marathons.id, marathonId))
    .returning();

  return updated;
}

export async function pauseMarathon(marathonId: string) {
  const marathon = await db.query.marathons.findFirst({ where: eq(marathons.id, marathonId) });
  if (!marathon) throw Object.assign(new Error('Marathon not found'), { statusCode: 404 });
  if (marathon.status !== 'running') throw Object.assign(new Error('Marathon is not running'), { statusCode: 400 });

  // Calculate elapsed since last start
  const now = new Date();
  const additionalElapsed = marathon.startedAt
    ? Math.floor((now.getTime() - new Date(marathon.startedAt).getTime()) / 1000)
    : 0;

  const [updated] = await db
    .update(marathons)
    .set({
      status: 'paused',
      elapsedSeconds: marathon.elapsedSeconds + additionalElapsed,
      startedAt: null,
      endsAt: null,
      updatedAt: now,
    })
    .where(eq(marathons.id, marathonId))
    .returning();

  return updated;
}

export async function resumeMarathon(marathonId: string) {
  const marathon = await db.query.marathons.findFirst({ where: eq(marathons.id, marathonId) });
  if (!marathon) throw Object.assign(new Error('Marathon not found'), { statusCode: 404 });
  if (marathon.status !== 'paused') throw Object.assign(new Error('Marathon is not paused'), { statusCode: 400 });

  const now = new Date();
  const remaining = marathon.durationSeconds + marathon.bonusSeconds - marathon.elapsedSeconds;
  const endsAt = new Date(now.getTime() + remaining * 1000);

  const [updated] = await db
    .update(marathons)
    .set({
      status: 'running',
      startedAt: now,
      endsAt,
      updatedAt: now,
    })
    .where(eq(marathons.id, marathonId))
    .returning();

  return updated;
}

export async function addBonusTime(marathonId: string, seconds: number) {
  const marathon = await db.query.marathons.findFirst({ where: eq(marathons.id, marathonId) });
  if (!marathon) throw Object.assign(new Error('Marathon not found'), { statusCode: 404 });

  const updates: Record<string, unknown> = {
    bonusSeconds: marathon.bonusSeconds + seconds,
    updatedAt: new Date(),
  };

  // If running, extend the endsAt
  if (marathon.status === 'running' && marathon.endsAt) {
    updates.endsAt = new Date(new Date(marathon.endsAt).getTime() + seconds * 1000);
  }

  const [updated] = await db
    .update(marathons)
    .set(updates)
    .where(eq(marathons.id, marathonId))
    .returning();

  return updated;
}

export async function updateMarathon(
  marathonId: string,
  data: { title?: string; bonusSeconds?: number; status?: string }
) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.bonusSeconds !== undefined) updates.bonusSeconds = data.bonusSeconds;

  const [updated] = await db
    .update(marathons)
    .set(updates)
    .where(eq(marathons.id, marathonId))
    .returning();

  return updated;
}
