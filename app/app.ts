import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import DynamicRateLimiter from './services/rate-limiting/dynamic_rate_limiter_service';
import UploadFileRateLimit from './services/rate-limiting/maximum_file_upload_service';
import ClientRateLimiter from './services/rate-limiting/maximum_user_upload_service';
import FileUploadService from './services/file-handling/file_handler_service';
import HealthService from './services/system-health/health_service';

dotenv.config();

const dynamicRateLimiter = new DynamicRateLimiter();
const uploadFileRateLimit = new UploadFileRateLimit(5);
const clientRateLimiter = new ClientRateLimiter();
const fileUploadService = new FileUploadService();
const healthService = new HealthService();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthService.getHealth(['https://www.google.com']);
    res.status(200).json(health);
  } catch (error) {
    console.error('Error fetching health data:', error);
    res.status(500).json({ error: 'Failed to retrieve health information.' });
  }
});

app.post(
  '/upload',
  clientRateLimiter.limit(),
  dynamicRateLimiter.getRateLimiter(),
  uploadFileRateLimit.limit(),
  (req: Request, res: Response) => {
    fileUploadService.handleFileUpload(req, res);
  },
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
