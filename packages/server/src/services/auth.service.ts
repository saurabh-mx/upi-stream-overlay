import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { env } from '../config/env.js';
import { users, sessions } from '../db/schema.js';
import type { AuthPayload } from '../middleware/auth.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { OAuth2Client } from 'google-auth-library';

const SALT_ROUNDS = 12;

export async function registerUser(email: string, password: string, displayName: string) {
  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      displayName,
      role: 'user',
    })
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      role: users.role,
      totpEnabled: users.totpEnabled,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  const tokens = await createTokens(user);
  return { user, ...tokens };
}

export async function loginUser(email: string, password: string, ipAddress?: string, userAgent?: string, totpCode?: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (!user.passwordHash) {
    throw Object.assign(new Error('This account uses a different login provider (e.g., Google). Please sign in using that method.'), { statusCode: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (user.totpEnabled) {
    if (!totpCode) {
      throw Object.assign(new Error('2FA code required'), { statusCode: 403, requires2FA: true });
    }
    const isValidTotp = speakeasy.totp.verify({
      secret: user.totpSecret!,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });
    if (!isValidTotp) {
      throw Object.assign(new Error('Invalid 2FA code'), { statusCode: 401 });
    }
  }

  const { passwordHash, totpSecret, ...safeUser } = user;
  const tokens = await createTokens(safeUser, ipAddress, userAgent);
  return { user: safeUser, ...tokens };
}

export async function loginWithGoogle(idToken: string, ipAddress?: string, userAgent?: string) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw Object.assign(new Error('Google Login is not configured'), { statusCode: 501 });
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw Object.assign(new Error('Invalid Google token'), { statusCode: 401 });
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;
  const displayName = payload.name || email.split('@')[0];
  const avatarUrl = payload.picture;

  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    // Register new user via Google
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        authProvider: 'google',
        googleId,
        displayName,
        avatarUrl,
        role: 'user',
      })
      .returning();
    user = newUser;
  } else {
    // Update googleId if missing
    if (!user.googleId || user.avatarUrl !== avatarUrl) {
      const [updatedUser] = await db
        .update(users)
        .set({ googleId, avatarUrl })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser;
    }
  }

  const { passwordHash, totpSecret, ...safeUser } = user;
  const tokens = await createTokens(safeUser, ipAddress, userAgent);
  return { user: safeUser, ...tokens };
}

export async function generateTotpSecret(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error('User not found');
  
  const secret = speakeasy.generateSecret({
    name: `StreamOverlay (${user.email})`
  });

  // Temporarily store secret (it should be confirmed before setting totpEnabled = true)
  await db.update(users).set({ totpSecret: secret.base32 }).where(eq(users.id, userId));

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  
  return {
    secret: secret.base32,
    qrCodeUrl
  };
}

export async function verifyAndEnableTotp(userId: string, token: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.totpSecret) throw new Error('No secret found to verify');

  const isValid = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token,
    window: 1
  });

  if (!isValid) {
    throw Object.assign(new Error('Invalid token'), { statusCode: 400 });
  }

  await db.update(users).set({ totpEnabled: true }).where(eq(users.id, userId));
}

export async function disableTotp(userId: string) {
  await db.update(users).set({ totpEnabled: false, totpSecret: null }).where(eq(users.id, userId));
}

export async function refreshAccessToken(refreshToken: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.refreshToken, refreshToken),
  });

  if (!session || new Date(session.expiresAt) < new Date()) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 401 });
  }

  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });

  return { accessToken };
}

export async function logoutUser(refreshToken: string) {
  await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
}

export async function getUserById(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return null;
  const { passwordHash, totpSecret, ...safeUser } = user;
  return safeUser;
}

async function createTokens(
  user: { id: string; email: string; role: 'admin' | 'user' },
  ipAddress?: string,
  userAgent?: string,
) {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
  });

  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    expiresAt,
  });

  return { accessToken, refreshToken };
}
