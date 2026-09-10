import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../config/db.js';
import { widgets } from '../db/schema.js';
import type { WidgetType, WidgetConfig } from '@upi-stream/shared';

export async function createWidget(
  workspaceId: string,
  type: WidgetType,
  config?: Partial<WidgetConfig>
) {
  const embedToken = nanoid(32);

  const [widget] = await db
    .insert(widgets)
    .values({
      workspaceId,
      type,
      embedToken,
      config: {
        width: config?.width || 400,
        height: config?.height || 200,
        ...config,
      },
    })
    .returning();

  return widget;
}

export async function getWidgetByToken(embedToken: string) {
  return db.query.widgets.findFirst({
    where: eq(widgets.embedToken, embedToken),
    with: {
      workspace: true,
    },
  });
}

export async function getWidgetsForWorkspace(workspaceId: string) {
  return db.query.widgets.findMany({
    where: eq(widgets.workspaceId, workspaceId),
  });
}

export async function updateWidget(widgetId: string, data: { config?: Partial<WidgetConfig>; isActive?: boolean }) {
  const existing = await db.query.widgets.findFirst({ where: eq(widgets.id, widgetId) });
  if (!existing) throw Object.assign(new Error('Widget not found'), { statusCode: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.config) updates.config = { ...(existing.config as WidgetConfig), ...data.config };
  if (data.isActive !== undefined) updates.isActive = data.isActive;

  const [updated] = await db
    .update(widgets)
    .set(updates)
    .where(eq(widgets.id, widgetId))
    .returning();

  return updated;
}
