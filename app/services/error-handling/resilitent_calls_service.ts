import CircuitBreaker from 'opossum';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
}

class ResilientCallsService {
  circuitBreaker: CircuitBreaker<any, AxiosResponse<any>>;
  maxRetries: number;
  baseDelay: number;
  circuitBreakerOptions: CircuitBreakerOptions;

  constructor(
    maxRetries = 5,
    baseDelay = 1000,
    circuitBreakerOptions: CircuitBreakerOptions = {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
    },
  ) {
    this.circuitBreakerOptions = circuitBreakerOptions;
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.circuitBreaker = new CircuitBreaker(
      this.postData.bind(this),
      circuitBreakerOptions,
    );

    this.circuitBreaker.on('open', () => console.warn('Circuit opened!'));
    this.circuitBreaker.on('close', () => console.info('Circuit closed!'));
    this.circuitBreaker.on('halfOpen', () => console.info('Circuit half-open'));
  }
  async postData(url: string, data: any): Promise<AxiosResponse<any>> {
    return await axios.post(url, data, { timeout: 5000 });
  }

  async postDataWithResilience(url: string, data: any): Promise<any> {
    try {
      return await this.circuitBreaker.fire(url, data);
    } catch (error) {
      console.warn('Circuit breaker triggered. Retrying with backoff...');
      return this.retryWithExponentialBackoff(url, data);
    }
  }

  async retryWithExponentialBackoff(url: string, data: any): Promise<any> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        console.info(`retry attempt: ${attempt + 1}...`);
        return await this.postData(url, data);
      } catch (error) {
        if (attempt >= this.maxRetries - 1) {
          throw new Error(`max retries reached. Failing...`);
        }
        const delay = this.getExponentialBackoffDelay(attempt);
        console.warn(`Retrying in ${delay}ms...`);
        await asyncSleep(delay);
      }
    }
  }

  getExponentialBackoffDelay(attempt: number): number {
    const randomJitter = Math.random() * 100;
    return Math.pow(2, attempt) * this.baseDelay + randomJitter;
  }
}

export default ResilientCallsService;
