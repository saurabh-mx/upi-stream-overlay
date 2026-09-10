import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema, googleLoginSchema } from '@upi-stream/shared';
import * as authService from '../services/auth.service.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    const result = await authService.registerUser(email, password, displayName);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password, totpCode } = req.body;
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    const result = await authService.loginUser(email, password, ip, ua, totpCode);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/google
router.post('/google', validate(googleLoginSchema), async (req, res, next) => {
  try {
    const { credential } = req.body;
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    const result = await authService.loginWithGoogle(credential, ip, ua);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/generate
router.post('/2fa/generate', authenticate, async (req, res, next) => {
  try {
    const result = await authService.generateTotpSecret(req.user!.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/verify
router.post('/2fa/verify', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    await authService.verifyAndEnableTotp(req.user!.userId, token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/disable
router.post('/2fa/disable', authenticate, async (req, res, next) => {
  try {
    await authService.disableTotp(req.user!.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
