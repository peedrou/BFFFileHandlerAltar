import axios from 'axios';
import os from 'os';

interface MemoryUsage {
  freeMemory: number;
  totalMemory: number;
  usedMemory: number;
  memoryUsagePercentage: number;
}

class HealthService {
  getCpuUsage(): number[] {
    const cpus: os.CpuInfo[] = os.cpus();
    const allCpuUsage: number[] = cpus.map((cpu) => {
      const totalCapacity: number = Object.values(cpu.times).reduce(
        (acc, curr) => acc + curr,
        0,
      );
      const usage: number = cpu.times.user + cpu.times.sys;
      return (usage / totalCapacity) * 100;
    });

    return allCpuUsage;
  }

  getCpuAverageUsage(): number {
    const allCpuUsage: number[] = this.getCpuUsage();
    const averageCpuUsage: number =
      allCpuUsage.reduce((acc, curr) => acc + curr, 0) / allCpuUsage.length;
    return averageCpuUsage;
  }

  getMemoryUsage(): MemoryUsage {
    const freeMemory: number = os.freemem();
    const totalMemory: number = os.totalmem();
    const usedMemory: number = totalMemory - freeMemory;
    const memoryUsagePercentage: number = (usedMemory / totalMemory) * 100;

    return {
      freeMemory,
      totalMemory,
      usedMemory,
      memoryUsagePercentage,
    };
  }

  async checkExternalDependencyHealth(url: string): Promise<boolean> {
    try {
      const response = await axios.get(url);
      return response.status === 200;
    } catch (error) {
      console.error('Error checking external API health:', error);
      return false;
    }
  }

  async getHealth(urls: string[] | null): Promise<object> {
    const cpuUsage: number[] = this.getCpuUsage();
    const memoryUsage: object = this.getMemoryUsage();
    const externals: { [key: string]: string } = {};
    if (urls != null) {
      for (const url of urls) {
        const externalHealth: boolean =
          await this.checkExternalDependencyHealth(url);
        externals[url] = externalHealth ? 'healthy' : 'unhealthy';
      }
    }

    return { cpuUsage, memoryUsage, externalDependencies: externals };
  }
}

export default HealthService;
