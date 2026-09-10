import { db } from '../config/db.js';
import { auditLogs } from '../db/schema.js';

export async function logAuditAction(
  workspaceId: string,
  userId: string,
  action: string,
  targetId?: string,
  details?: Record<string, any>
) {
  try {
    await db.insert(auditLogs).values({
      workspaceId,
      userId,
      action,
      targetId: targetId || null,
      details: details || null,
    });
  } catch (err) {
    console.error('Failed to log audit action:', err);
  }
}

export async function getAuditLogs(workspaceId: string, page = 1, limit = 50) {
  const offset = (page - 1) * limit;

  const logs = await db.query.auditLogs.findMany({
    where: (logs, { eq }) => eq(logs.workspaceId, workspaceId),
    with: {
      user: {
        columns: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: (logs, { desc }) => [desc(logs.createdAt)],
    limit,
    offset,
  });

  return logs;
}
