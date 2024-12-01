import { Request, Response, NextFunction } from 'express';
import ClientRateLimiter from '../../app/services/rate-limiting/maximum_user_upload_service';

jest.mock('express-rate-limit', () =>
  jest.fn(() => {
    let requestCount = 0;
    return jest.fn((req: Request, res: Response, next: NextFunction) => {
      if (requestCount >= 1 || req.ip === 'blocked-ip') {
        res.status(429).json({
          message:
            'Too many request, please wait 10 seconds before retrying...',
        });
      } else {
        requestCount++;
        next();
      }
    });
  }),
);

describe('ClientRateLimiter', () => {
  let rateLimiter: ClientRateLimiter;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    rateLimiter = new ClientRateLimiter();
    req = { ip: 'test-ip' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('should allow a request when limit is not exceeded', () => {
    rateLimiter.limit()(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should return 429 status when limit is exceeded for the same IP', () => {
    rateLimiter.limit()(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();

    rateLimiter.limit()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Too many request, please wait 10 seconds before retrying...',
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 429 for a blocked IP (blocked-ip)', () => {
    (req as any).ip = 'blocked-ip';

    rateLimiter.limit()(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Too many request, please wait 10 seconds before retrying...',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
