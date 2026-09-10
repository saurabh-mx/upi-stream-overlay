import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import goalRoutes from './routes/goal.routes.js';
import marathonRoutes from './routes/marathon.routes.js';
import donationRoutes from './routes/donation.routes.js';
import widgetRoutes from './routes/widget.routes.js';
import embedRoutes from './routes/embed.routes.js';

const app = express();

// ─── Global Middleware ───────────────────────────────────
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

// ─── Health Check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:wid/goals', goalRoutes);
app.use('/api/workspaces/:wid/marathons', marathonRoutes);
app.use('/api/workspaces/:wid/donations', donationRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/embed', embedRoutes);

// ─── Error Handler ───────────────────────────────────────
app.use(errorHandler);

export default app;

