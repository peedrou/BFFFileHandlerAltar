import { Request, Response, NextFunction, RequestHandler } from 'express';

class UploadFileRateLimitService {
  activeUploads: number = 0;
  maxConcurrentUploads: number;

  constructor(maxConcurrentUploads: number = 5) {
    this.maxConcurrentUploads = maxConcurrentUploads;
  }

  limit(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.activeUploads >= this.maxConcurrentUploads) {
        res.status(429).json({
          message: 'Too many concurrent request, please wait and try again',
        });
        return;
      }

      this.activeUploads++;

      if (res.on('finish', () => this.activeUploads--)) next();
    };
  }
}

export default UploadFileRateLimitService;
