import { Request, Response, Express } from 'express';
import HealthService from '../services/system-health/health_service';

class HealthController {
  constructor(
    app: Express,
    healthService: HealthService,
    urls: string[] | null,
  ) {
    app.get('/health', async (req: Request, res: Response) => {
      try {
        const health = await healthService.getHealth(urls);
        res.status(200).json(health);
      } catch (error) {
        console.error('Error fetching health data:', error);
        res
          .status(500)
          .json({ error: 'Failed to retrieve health information.' });
      }
    });
  }
}

export default HealthController;
