import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { initSocket } from './socket/index.js';

const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   UPI Stream Overlay — API Server        ║
  ║                                          ║
  ║   Port:  ${String(env.PORT).padEnd(30)}║
  ║   Mode:  ${env.NODE_ENV.padEnd(30)}║
  ║   CORS:  ${env.CORS_ORIGIN.slice(0, 30).padEnd(30)}║
  ╚══════════════════════════════════════════╝
  `);
});
