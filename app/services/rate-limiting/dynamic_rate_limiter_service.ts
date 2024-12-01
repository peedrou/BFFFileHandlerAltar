import rateLimit from 'express-rate-limit';
import { RequestHandler } from 'express';
import HealthService from '../system-health/health_service';

class DynamicRateLimiterService {
  healthService: HealthService;
  currentMaxRequests: number = 10;
  highCpuThreshold: number = 80;
  highMemoryThreshold: number = 80;
  adjustInterval: number = 5000;

  constructor(
    healthService: HealthService,
    initialMaxRequests = 10,
    highCpuThreshold = 80,
    highMemoryThreshold = 80,
    adjustInterval = 5000,
  ) {
    this.healthService = healthService;
    this.currentMaxRequests = initialMaxRequests;
    this.highCpuThreshold = highCpuThreshold;
    this.highMemoryThreshold = highMemoryThreshold;
    this.adjustInterval = adjustInterval;

    this.adjustRateLimit();
  }

  async adjustRateLimit(): Promise<void> {
    const memoryUsageObject = this.healthService.getMemoryUsage();
    const memoryUsage: number = memoryUsageObject.memoryUsagePercentage;
    const cpuUsage: number = this.healthService.getCpuAverageUsage();

    if (
      cpuUsage > this.highCpuThreshold ||
      memoryUsage > this.highMemoryThreshold
    ) {
      this.currentMaxRequests = 2;
    } else if (cpuUsage < 50 && memoryUsage < 50) {
      this.currentMaxRequests = 10;
    }

    setTimeout(() => this.adjustRateLimit(), this.adjustInterval);
  }

  getRateLimiter(): RequestHandler {
    return rateLimit({
      windowMs: 1000,
      max: (req, res) => this.currentMaxRequests,
      keyGenerator: (req) => req.ip || 'unknown or no IP found',
      handler: (req, res) => {
        res.status(429).json({
          message: 'Too many requests. Please try again later.',
        });
      },
    });
  }
}

export default DynamicRateLimiterService;
