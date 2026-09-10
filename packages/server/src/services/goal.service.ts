import { eq, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { goals } from '../db/schema.js';
import { DEFAULT_GOAL_STYLE } from '@upi-stream/shared';
import type { GoalStyleConfig, GoalDisplayType } from '@upi-stream/shared';

export async function createGoal(
  workspaceId: string,
  data: {
    title: string;
    description?: string;
    targetAmount: number;
    displayType?: GoalDisplayType;
    styleConfig?: Partial<GoalStyleConfig>;
  }
) {
  const [goal] = await db
    .insert(goals)
    .values({
      workspaceId,
      title: data.title,
      description: data.description || null,
      targetAmount: data.targetAmount,
      displayType: data.displayType || 'bar',
      styleConfig: { ...DEFAULT_GOAL_STYLE, ...data.styleConfig },
    })
    .returning();

  return goal;
}

export async function getGoalsForWorkspace(workspaceId: string) {
  return db.query.goals.findMany({
    where: eq(goals.workspaceId, workspaceId),
    orderBy: (goals, { desc }) => [desc(goals.createdAt)],
  });
}

export async function getGoalById(goalId: string) {
  return db.query.goals.findFirst({
    where: eq(goals.id, goalId),
  });
}

export async function updateGoal(
  goalId: string,
  data: {
    title?: string;
    description?: string;
    currentAmount?: number;
    targetAmount?: number;
    displayType?: GoalDisplayType;
    styleConfig?: Partial<GoalStyleConfig>;
    isActive?: boolean;
  }
) {
  const existing = await db.query.goals.findFirst({ where: eq(goals.id, goalId) });
  if (!existing) throw Object.assign(new Error('Goal not found'), { statusCode: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.currentAmount !== undefined) updates.currentAmount = data.currentAmount;
  if (data.targetAmount !== undefined) updates.targetAmount = data.targetAmount;
  if (data.displayType !== undefined) updates.displayType = data.displayType;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (data.styleConfig) {
    updates.styleConfig = { ...(existing.styleConfig as GoalStyleConfig), ...data.styleConfig };
  }

  const [updated] = await db
    .update(goals)
    .set(updates)
    .where(eq(goals.id, goalId))
    .returning();

  return updated;
}

export async function deleteGoal(goalId: string) {
  await db.delete(goals).where(eq(goals.id, goalId));
}
