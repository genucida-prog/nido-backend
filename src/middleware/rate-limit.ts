import rateLimit from 'express-rate-limit';

export function rateLimitMiddleware(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    max: limit,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}