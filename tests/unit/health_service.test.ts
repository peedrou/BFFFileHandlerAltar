import HealthService from '../../app/services/system-health/health_service';
import axios from 'axios';
import os from 'os';

jest.mock('axios');
jest.mock('os');

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCpuUsage', () => {
    it('should calculate CPU usage for each CPU core', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, sys: 50, idle: 200, irq: 0 } },
        { times: { user: 200, sys: 100, idle: 300, irq: 0 } },
      ]);

      const result = healthService.getCpuUsage();

      expect(result).toEqual([42.9, 50]);
    });
  });

  describe('getCpuAverageUsage', () => {
    it('should calculate average CPU usage across all cores', () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, sys: 50, idle: 200, irq: 0 } },
        { times: { user: 200, sys: 100, idle: 300, irq: 0 } },
      ]);

      const result = healthService.getCpuAverageUsage();

      expect(result).toBeCloseTo(46.5, 4);
    });
  });

  describe('getMemoryUsage', () => {
    it('should calculate memory usage details', () => {
      (os.freemem as jest.Mock).mockReturnValue(2_000_000_000);
      (os.totalmem as jest.Mock).mockReturnValue(8_000_000_000);

      const result = healthService.getMemoryUsage();

      expect(result).toEqual({
        freeMemory: 2_000_000_000,
        totalMemory: 8_000_000_000,
        usedMemory: 6_000_000_000,
        memoryUsagePercentage: 75,
      });
    });
  });

  describe('checkExternalDependencyHealth', () => {
    it('should return true if external service is healthy (status 200)', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ status: 200 });

      const result =
        await healthService.checkExternalDependencyHealth('https://altar.io');

      expect(result).toBe(true);
      expect(axios.get).toHaveBeenCalledWith('https://altar.io');
    });

    it('should return false if external service is unhealthy (status not 200)', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ status: 500 });

      const result =
        await healthService.checkExternalDependencyHealth('https://altar.io');

      expect(result).toBe(false);
      expect(axios.get).toHaveBeenCalledWith('https://altar.io');
    });

    it('should return false if there is an error while checking external service health', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const result =
        await healthService.checkExternalDependencyHealth('https://altar.io');

      expect(result).toBe(false);
      expect(axios.get).toHaveBeenCalledWith('https://altar.io');
    });
  });

  describe('getHealth', () => {
    it('should return health information for CPU, memory, and external dependencies', async () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, sys: 50, idle: 200, irq: 0 } },
        { times: { user: 200, sys: 100, idle: 300, irq: 0 } },
      ]);
      (os.freemem as jest.Mock).mockReturnValue(2_000_000_000);
      (os.totalmem as jest.Mock).mockReturnValue(8_000_000_000);

      (axios.get as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await healthService.getHealth(['https://altar.io']);

      expect(result).toEqual({
        cpuUsage: [42.9, 50],
        memoryUsage: {
          freeMemory: 2_000_000_000,
          totalMemory: 8_000_000_000,
          usedMemory: 6_000_000_000,
          memoryUsagePercentage: 75,
        },
        externalDependencies: {
          'https://altar.io': 'healthy',
        },
      });
    });

    it('should return healthy status as "unhealthy" for external dependencies if the URL is unreachable', async () => {
      (os.cpus as jest.Mock).mockReturnValue([
        { times: { user: 100, sys: 50, idle: 200, irq: 0 } },
        { times: { user: 200, sys: 100, idle: 300, irq: 0 } },
      ]);
      (os.freemem as jest.Mock).mockReturnValue(2_000_000_000);
      (os.totalmem as jest.Mock).mockReturnValue(8_000_000_000);

      (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const result = await healthService.getHealth(['https://altar.io']);

      expect(result).toEqual({
        cpuUsage: [42.9, 50],
        memoryUsage: {
          freeMemory: 2_000_000_000,
          totalMemory: 8_000_000_000,
          usedMemory: 6_000_000_000,
          memoryUsagePercentage: 75,
        },
        externalDependencies: {
          'https://altar.io': 'unhealthy',
        },
      });
    });
  });
});
