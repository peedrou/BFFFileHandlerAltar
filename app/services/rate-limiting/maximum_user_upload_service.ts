import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';

class ClientRateLimiter {
  rateLimiter: RequestHandler;

  constructor() {
    this.rateLimiter = rateLimit({
      windowMs: 10000,
      max: 1,
      message: 'Too many request, please wait 10 seconds before retrying...',
      keyGenerator: (req) => req.ip || 'unknown',
    });
  }

  limit(): RequestHandler {
    return this.rateLimiter;
  }
}

export default ClientRateLimiter;
