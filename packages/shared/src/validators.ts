import { z } from 'zod';

// ─── Auth Validators ────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .trim(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().length(6).optional(),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Workspace Validators ────────────────────────────────
export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100, 'Workspace name must be at most 100 characters')
    .trim(),
  theme: z
    .object({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      fontFamily: z.string().max(50).optional(),
    })
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  theme: z
    .object({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      fontFamily: z.string().max(50).optional(),
    })
    .optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateMemberPermissionsSchema = z.object({
  canAdjustTimer: z.boolean().optional(),
  canManagePayments: z.boolean().optional(),
  canUpdateGoals: z.boolean().optional(),
  canSendAlerts: z.boolean().optional(),
});

// ─── Goal Validators ─────────────────────────────────────
export const createGoalSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  description: z.string().max(1000).optional(),
  targetAmount: z.number().int().positive('Target amount must be positive'),
  displayType: z.enum(['bar', 'circle', 'animated']).default('bar'),
  styleConfig: z
    .object({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      animation: z.enum(['pulse', 'glow', 'fill', 'none']).optional(),
      fontSize: z.number().int().min(10).max(48).optional(),
    })
    .optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(1000).optional(),
  currentAmount: z.number().int().min(0).optional(),
  targetAmount: z.number().int().positive().optional(),
  displayType: z.enum(['bar', 'circle', 'animated']).optional(),
  styleConfig: z
    .object({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      animation: z.enum(['pulse', 'glow', 'fill', 'none']).optional(),
      fontSize: z.number().int().min(10).max(48).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

// ─── Marathon Validators ─────────────────────────────────
export const createMarathonSchema = z.object({
  title: z.string().min(1).max(255).trim(),
  durationSeconds: z.number().int().positive('Duration must be positive'),
  rules: z
    .object({
      donationToTime: z.record(z.string(), z.number().int().positive()).default({}),
    })
    .optional(),
});

export const updateMarathonSchema = z.object({
  title: z.string().min(1).max(255).trim().optional(),
  bonusSeconds: z.number().int().min(0).optional(),
  status: z.enum(['idle', 'running', 'paused', 'finished']).optional(),
});

// ─── Donation Validators ─────────────────────────────────
export const createDonationSchema = z.object({
  donorName: z.string().min(1).max(100).trim(),
  donorEmail: z.string().email().optional(),
  amount: z.number().int().positive('Amount must be positive'),
  currency: z.string().length(3).default('INR'),
  message: z.string().max(500).optional(),
  goalId: z.string().uuid().optional(),
  marathonId: z.string().uuid().optional(),
});

// ─── Widget Validators ───────────────────────────────────
export const createWidgetSchema = z.object({
  workspaceId: z.string().uuid(),
  type: z.enum(['goal', 'marathon', 'leaderboard', 'ticker']),
  config: z
    .object({
      width: z.number().int().min(100).max(1920).default(400),
      height: z.number().int().min(50).max(1080).default(200),
      themeOverrides: z
        .object({
          primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        })
        .optional(),
    })
    .optional(),
});

export const updateWidgetSchema = z.object({
  config: z
    .object({
      width: z.number().int().min(100).max(1920).optional(),
      height: z.number().int().min(50).max(1080).optional(),
      themeOverrides: z
        .object({
          primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        })
        .optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

// ─── Type Exports ────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberPermissionsInput = z.infer<typeof updateMemberPermissionsSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateMarathonInput = z.infer<typeof createMarathonSchema>;
export type UpdateMarathonInput = z.infer<typeof updateMarathonSchema>;
export type CreateDonationInput = z.infer<typeof createDonationSchema>;
export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
