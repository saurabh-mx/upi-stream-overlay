import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled error:', err);

  const statusCode = (err as any).statusCode || 500;
  const message =
    env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  res.status(statusCode).json({
    error: message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}
