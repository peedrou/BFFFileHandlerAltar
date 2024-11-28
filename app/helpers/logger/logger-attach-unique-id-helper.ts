import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from './logger-helper';

export function logRequestId(req: Request, res: Response, next: NextFunction) {
  const requestId: string = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.locals.requestId = requestId;

  logger.info('New Incoming Request', {
    requestId,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  next();
}
