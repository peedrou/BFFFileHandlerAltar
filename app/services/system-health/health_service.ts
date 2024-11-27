import axios from 'axios';
import os from 'os';

class HealthService {
  getCpuUsage() {
    const cpus = os.cpus();
    const allCpuUsage = cpus.map((cpu) => {
      const totalCapacity = Object.values(cpu.times).reduce(
        (acc, curr) => acc + curr,
        0,
      );
      const usage = cpu.times.user + cpu.times.sys;
      return (usage / totalCapacity) * 100;
    });

    return allCpuUsage;
  }

  getMemoryUsage() {
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

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

  async getHealth(urls: string[] | null) {
    const cpuUsage = this.getCpuUsage();
    const memoryUsage = this.getMemoryUsage();
    const externals: { [key: string]: string } = {};
    if (urls != null) {
      for (const url of urls) {
        const externalHealth: boolean =
          await this.checkExternalDependencyHealth(url);
        externals[url] = externalHealth ? 'healthy' : 'unhealthy';
      }
    }
    // TODO: add external dependencies health

    return { cpuUsage, memoryUsage, externalDependencies: externals };
  }
}
