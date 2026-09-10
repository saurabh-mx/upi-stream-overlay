import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../config/db.js';
import { workspaces, workspaceMembers, users } from '../db/schema.js';
import { DEFAULT_WORKSPACE_THEME, DEFAULT_MOD_PERMISSIONS } from '@upi-stream/shared';
import type { WorkspaceTheme, ModeratorPermissions } from '@upi-stream/shared';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

export async function createWorkspace(ownerId: string, name: string, theme?: Partial<WorkspaceTheme>) {
  const slug = `${slugify(name)}-${nanoid(6)}`;
  const inviteCode = nanoid(12);

  const [workspace] = await db
    .insert(workspaces)
    .values({
      ownerId,
      name,
      slug,
      inviteCode,
      theme: { ...DEFAULT_WORKSPACE_THEME, ...theme },
    })
    .returning();

  // Add owner as a member with 'owner' role
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: ownerId,
    role: 'owner',
    permissions: null, // Owner doesn't need per-permission toggles
  });

  return workspace;
}

export async function getWorkspacesForUser(userId: string) {
  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, userId),
    with: {
      workspace: true,
    },
  });
  return memberships.map((m) => ({
    ...m.workspace,
    myRole: m.role,
  }));
}

export async function getWorkspaceById(workspaceId: string) {
  return db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    with: {
      members: {
        with: {
          user: {
            columns: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });
}

export async function updateWorkspace(workspaceId: string, data: { name?: string; theme?: Partial<WorkspaceTheme> }) {
  const existing = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });
  if (!existing) throw Object.assign(new Error('Workspace not found'), { statusCode: 404 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name) {
    updates.name = data.name;
    updates.slug = `${slugify(data.name)}-${nanoid(6)}`;
  }
  if (data.theme) {
    updates.theme = { ...(existing.theme as WorkspaceTheme), ...data.theme };
  }

  const [updated] = await db
    .update(workspaces)
    .set(updates)
    .where(eq(workspaces.id, workspaceId))
    .returning();

  return updated;
}

export async function deleteWorkspace(workspaceId: string) {
  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
}

export async function joinWorkspaceByCode(userId: string, inviteCode: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.inviteCode, inviteCode),
  });
  if (!workspace) throw Object.assign(new Error('Invalid invite code'), { statusCode: 404 });

  // Check if already a member
  const existing = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspace.id),
      eq(workspaceMembers.userId, userId)
    ),
  });
  if (existing) throw Object.assign(new Error('You are already a member of this workspace'), { statusCode: 409 });

  const [member] = await db
    .insert(workspaceMembers)
    .values({
      workspaceId: workspace.id,
      userId,
      role: 'moderator',
      permissions: DEFAULT_MOD_PERMISSIONS,
    })
    .returning();

  return { workspace, member };
}

export async function updateModeratorPermissions(
  workspaceId: string,
  memberId: string,
  permissions: Partial<ModeratorPermissions>
) {
  const member = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.id, memberId),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });

  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  if (member.role === 'owner') throw Object.assign(new Error('Cannot modify owner permissions'), { statusCode: 400 });

  const currentPerms = (member.permissions || DEFAULT_MOD_PERMISSIONS) as ModeratorPermissions;
  const updatedPerms = { ...currentPerms, ...permissions };

  const [updated] = await db
    .update(workspaceMembers)
    .set({ permissions: updatedPerms })
    .where(eq(workspaceMembers.id, memberId))
    .returning();

  return updated;
}

export async function removeMember(workspaceId: string, memberId: string) {
  const member = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.id, memberId),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });
  if (member.role === 'owner') throw Object.assign(new Error('Cannot remove workspace owner'), { statusCode: 400 });

  await db.delete(workspaceMembers).where(eq(workspaceMembers.id, memberId));
}
