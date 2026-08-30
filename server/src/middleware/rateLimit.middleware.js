import rateLimit from 'express-rate-limit';

// Session/answer generation triggers multiple Gemini calls per request —
// keep this tight enough to prevent quota abuse without blocking a normal interview flow.
export const sessionRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

export const keyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});
