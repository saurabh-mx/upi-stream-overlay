import 'dotenv/config';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { db, pool } from '../config/db.js';
import { users, workspaces, workspaceMembers, goals, marathons, donations } from './schema.js';
import { DEFAULT_WORKSPACE_THEME, DEFAULT_GOAL_STYLE, DEFAULT_MOD_PERMISSIONS } from '@upi-stream/shared';

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Users ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const [admin] = await db
    .insert(users)
    .values({
      email: 'admin@example.com',
      passwordHash,
      displayName: 'Admin User',
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning();

  const [streamer] = await db
    .insert(users)
    .values({
      email: 'streamer@example.com',
      passwordHash,
      displayName: 'ProGamerX',
      role: 'user',
    })
    .onConflictDoNothing()
    .returning();

  const [mod] = await db
    .insert(users)
    .values({
      email: 'mod@example.com',
      passwordHash,
      displayName: 'ModHelper',
      role: 'user',
    })
    .onConflictDoNothing()
    .returning();

  if (!streamer || !mod) {
    console.log('⚠️  Users already exist, skipping seed.');
    await pool.end();
    return;
  }

  console.log('  ✓ Users created');

  // ─── Workspace ──────────────────────────────────────────
  const [workspace] = await db
    .insert(workspaces)
    .values({
      ownerId: streamer.id,
      name: 'ProGamerX Stream',
      slug: `progamerx-stream-${nanoid(6)}`,
      inviteCode: nanoid(12),
      theme: DEFAULT_WORKSPACE_THEME,
    })
    .returning();

  // Add owner as member
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: streamer.id,
    role: 'owner',
    permissions: null,
  });

  // Add moderator
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: mod.id,
    role: 'moderator',
    permissions: DEFAULT_MOD_PERMISSIONS,
  });

  console.log('  ✓ Workspace created');
  console.log(`    Invite code: ${workspace.inviteCode}`);

  // ─── Goals ──────────────────────────────────────────────
  const [goal1] = await db
    .insert(goals)
    .values({
      workspaceId: workspace.id,
      title: 'New Webcam Fund',
      description: 'Help me upgrade to a 4K webcam!',
      targetAmount: 1500000, // ₹15,000 in paise
      currentAmount: 450000,
      displayType: 'bar',
      styleConfig: DEFAULT_GOAL_STYLE,
    })
    .returning();

  await db.insert(goals).values({
    workspaceId: workspace.id,
    title: 'Charity Goal',
    description: 'Raising funds for local shelter',
    targetAmount: 5000000, // ₹50,000
    currentAmount: 1200000,
    displayType: 'circle',
    styleConfig: { ...DEFAULT_GOAL_STYLE, primaryColor: '#06b6d4', animation: 'glow' },
  });

  console.log('  ✓ Goals created');

  // ─── Marathon ───────────────────────────────────────────
  await db.insert(marathons).values({
    workspaceId: workspace.id,
    title: '24 Hour Gaming Marathon',
    durationSeconds: 86400,
    elapsedSeconds: 0,
    bonusSeconds: 0,
    status: 'idle',
    rules: {
      donationToTime: {
        '10000': 60,      // ₹100 = 1 min
        '50000': 300,     // ₹500 = 5 min
        '100000': 900,    // ₹1000 = 15 min
      },
    },
  });

  console.log('  ✓ Marathon created');

  // ─── Donations ──────────────────────────────────────────
  const donors = ['NightOwl', 'StreamFan99', 'CoolDude', 'GamerGirl', 'Anonymous'];
  for (let i = 0; i < 15; i++) {
    await db.insert(donations).values({
      workspaceId: workspace.id,
      goalId: goal1.id,
      donorName: donors[i % donors.length],
      amount: Math.floor(Math.random() * 50000) + 5000,
      currency: 'INR',
      message: i % 3 === 0 ? 'Keep it up! 🔥' : null,
      status: 'completed',
    });
  }

  console.log('  ✓ Sample donations created');
  console.log('\n✅ Seed complete!\n');
  console.log('Default credentials (all passwords: password123):');
  console.log('  admin@example.com    (Admin)');
  console.log('  streamer@example.com (Streamer/Owner)');
  console.log('  mod@example.com      (Moderator)');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
