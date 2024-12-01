import DynamicRateLimiter from '../../app/services/rate-limiting/dynamic_rate_limiter_service';
import HealthService from '../../app/services/system-health/health_service';

jest.mock('../../app/services/system-health/health_service');

describe('DynamicRateLimiter', () => {
  let dynamicRateLimiter: DynamicRateLimiter;
  let mockHealthService: jest.Mocked<HealthService>;

  mockHealthService = new HealthService() as jest.Mocked<HealthService>;

  mockHealthService.getMemoryUsage.mockReturnValue({
    memoryUsagePercentage: 30,
    freeMemory: 0,
    totalMemory: 0,
    usedMemory: 0,
  });
  mockHealthService.getCpuAverageUsage.mockReturnValue(30);

  dynamicRateLimiter = new DynamicRateLimiter(mockHealthService);
  dynamicRateLimiter.healthService = mockHealthService;

  it('should initialize with default values', () => {
    expect(dynamicRateLimiter.currentMaxRequests).toBe(10);
    expect(dynamicRateLimiter.highCpuThreshold).toBe(80);
    expect(dynamicRateLimiter.highMemoryThreshold).toBe(80);
  });

  it('should reduce max requests to 2 when CPU and memory usage are high', async () => {
    mockHealthService.getMemoryUsage.mockReturnValue({
      memoryUsagePercentage: 85,
      freeMemory: 0,
      totalMemory: 0,
      usedMemory: 0,
    });
    mockHealthService.getCpuAverageUsage.mockReturnValue(85);

    await dynamicRateLimiter.adjustRateLimit();

    expect(dynamicRateLimiter.currentMaxRequests).toBe(2);
  });

  it('should set max requests back to 10 when CPU and memory usage are low', async () => {
    mockHealthService.getMemoryUsage.mockReturnValue({
      memoryUsagePercentage: 20,
      freeMemory: 0,
      totalMemory: 0,
      usedMemory: 0,
    });
    mockHealthService.getCpuAverageUsage.mockReturnValue(20);

    await dynamicRateLimiter.adjustRateLimit();

    expect(dynamicRateLimiter.currentMaxRequests).toBe(10);
  });

  it('should return a RequestHandler from getRateLimiter', () => {
    const rateLimiter = dynamicRateLimiter.getRateLimiter();

    expect(rateLimiter).toBeDefined();
    expect(typeof rateLimiter).toBe('function');
  });

  // it('should limit requests based on currentMaxRequests', (done) => {
  //   mockHealthService.getMemoryUsage.mockReturnValue({
  //     memoryUsagePercentage: 85,
  //     freeMemory: 0,
  //     totalMemory: 0,
  //     usedMemory: 0,
  //   });
  //   mockHealthService.getCpuAverageUsage.mockReturnValue(85);
  //   console.log('getMemoryUsage', mockHealthService.getMemoryUsage());
  //   const rateLimiter = dynamicRateLimiter.getRateLimiter();

  //   console.log(rateLimiter);
  //   const mockRequest = { ip: '127.0.0.1' } as any;
  //   const mockResponse = {
  //     status: jest.fn().mockReturnThis(),
  //     json: jest.fn(),
  //   } as any;

  //   for (let i = 0; i < 10; i++) {
  //     rateLimiter(mockRequest, mockResponse, () => {
  //       console.log(`Request ${i + 1} allowed`, mockResponse);
  //     });
  //   }

  //   rateLimiter(mockRequest, mockResponse, () => {});

  //   expect(mockResponse.status).toHaveBeenCalledWith(429);
  //   expect(mockResponse.json).toHaveBeenCalledWith({
  //     message: 'Too many requests. Please try again later.',
  //   });
  //   done();
  // });
});
