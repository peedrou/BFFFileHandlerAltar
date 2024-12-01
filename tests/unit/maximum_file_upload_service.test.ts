import { Request, Response, NextFunction } from 'express';
import UploadFileRateLimit from '../../app/services/rate-limiting/maximum_file_upload_service';

describe(UploadFileRateLimit, () => {
  let rateLimiter: UploadFileRateLimit;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    rateLimiter = new UploadFileRateLimit(2);
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'finish') {
          setImmediate(callback);
        }
        return res;
      }),
    } as Partial<Response>;
    next = jest.fn();
  });
  it('should increment activeUploads and call next when within the limit', () => {
    rateLimiter.limit()(req as Request, res as Response, next as NextFunction);

    expect(rateLimiter.activeUploads).toBe(1);
    expect(next).toHaveBeenCalled();
  });

  it('should decrement activeUploads when the response finishes', () => {
    rateLimiter.limit()(req as Request, res as Response, next as NextFunction);

    expect(rateLimiter.activeUploads).toBe(1);

    res.on?.('finish', () => expect(rateLimiter.activeUploads).toBe(0));
  });

  it('should return 429 Too Many Requests when limit is exceeded', () => {
    rateLimiter.limit()(req as Request, res as Response, next);
    rateLimiter.limit()(req as Request, res as Response, next);
    rateLimiter.limit()(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Too many concurrent request, please wait and try again',
    });
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should correctly handle multiple concurrent requests', () => {
    rateLimiter.limit()(req as Request, res as Response, next);
    rateLimiter.limit()(req as Request, res as Response, next);

    expect(rateLimiter.activeUploads).toBe(2);
    expect(next).toHaveBeenCalledTimes(2);

    res.on?.('finish', () => {
      expect(rateLimiter.activeUploads).toBe(0);
    });
  });
});
