import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { ModeratorPermissions, GoalStyleConfig, WorkspaceTheme, MarathonRules, WidgetConfig } from '@upi-stream/shared';

// ─── Enums ───────────────────────────────────────────────
export const globalRoleEnum = pgEnum('global_role', ['admin', 'user']);
export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'moderator']);
export const displayTypeEnum = pgEnum('display_type', ['bar', 'circle', 'animated']);
export const marathonStatusEnum = pgEnum('marathon_status', ['idle', 'running', 'paused', 'finished']);
export const donationStatusEnum = pgEnum('donation_status', ['pending', 'completed', 'refunded']);
export const widgetTypeEnum = pgEnum('widget_type', ['goal', 'marathon', 'leaderboard', 'ticker']);
export const paymentStatusEnum = pgEnum('payment_status', ['initiated', 'success', 'failed', 'refunded']);
export const paymentProviderEnum = pgEnum('payment_provider', ['razorpay', 'stripe', 'manual']);

// ─── Users ───────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  authProvider: varchar('auth_provider', { length: 50 }).default('local').notNull(),
  googleId: varchar('google_id', { length: 255 }),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  role: globalRoleEnum('role').default('user').notNull(),
  totpSecret: varchar('totp_secret', { length: 255 }),
  totpEnabled: boolean('totp_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Sessions ────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: varchar('refresh_token', { length: 500 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Workspaces ──────────────────────────────────────────
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  inviteCode: varchar('invite_code', { length: 20 }).notNull().unique(),
  theme: jsonb('theme').$type<WorkspaceTheme>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Workspace Members ───────────────────────────────────
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: workspaceRoleEnum('role').notNull(),
    permissions: jsonb('permissions').$type<ModeratorPermissions>(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('workspace_user_idx').on(table.workspaceId, table.userId),
  ]
);

// ─── Goals ───────────────────────────────────────────────
export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  targetAmount: integer('target_amount').notNull(),
  currentAmount: integer('current_amount').default(0).notNull(),
  displayType: displayTypeEnum('display_type').default('bar').notNull(),
  styleConfig: jsonb('style_config').$type<GoalStyleConfig>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Marathons ───────────────────────────────────────────
export const marathons = pgTable('marathons', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  elapsedSeconds: integer('elapsed_seconds').default(0).notNull(),
  bonusSeconds: integer('bonus_seconds').default(0).notNull(),
  status: marathonStatusEnum('status').default('idle').notNull(),
  startedAt: timestamp('started_at'),
  endsAt: timestamp('ends_at'),
  rules: jsonb('rules').$type<MarathonRules>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Donations ───────────────────────────────────────────
export const donations = pgTable('donations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  marathonId: uuid('marathon_id').references(() => marathons.id, { onDelete: 'set null' }),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  donorName: varchar('donor_name', { length: 100 }).notNull(),
  donorEmail: varchar('donor_email', { length: 255 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).default('INR').notNull(),
  message: text('message'),
  status: donationStatusEnum('status').default('completed').notNull(),
  paymentRef: varchar('payment_ref', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Widgets ─────────────────────────────────────────────
export const widgets = pgTable('widgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  type: widgetTypeEnum('type').notNull(),
  embedToken: varchar('embed_token', { length: 64 }).notNull().unique(),
  config: jsonb('config').$type<WidgetConfig>().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Payments (placeholder for future) ───────────────────
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  donationId: uuid('donation_id')
    .notNull()
    .references(() => donations.id, { onDelete: 'cascade' }),
  provider: paymentProviderEnum('provider').default('manual').notNull(),
  providerTxnId: varchar('provider_txn_id', { length: 255 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).default('INR').notNull(),
  status: paymentStatusEnum('status').default('success').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  ownedWorkspaces: many(workspaces),
  memberships: many(workspaceMembers),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  goals: many(goals),
  marathons: many(marathons),
  donations: many(donations),
  widgets: many(widgets),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, { fields: [workspaceMembers.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [goals.workspaceId], references: [workspaces.id] }),
  donations: many(donations),
}));

export const marathonsRelations = relations(marathons, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [marathons.workspaceId], references: [workspaces.id] }),
  donations: many(donations),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  workspace: one(workspaces, { fields: [donations.workspaceId], references: [workspaces.id] }),
  marathon: one(marathons, { fields: [donations.marathonId], references: [marathons.id] }),
  goal: one(goals, { fields: [donations.goalId], references: [goals.id] }),
}));

export const widgetsRelations = relations(widgets, ({ one }) => ({
  workspace: one(workspaces, { fields: [widgets.workspaceId], references: [workspaces.id] }),
}));

// ─── Audit Logs ──────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  targetId: varchar('target_id', { length: 255 }),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [auditLogs.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
