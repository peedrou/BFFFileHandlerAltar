import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import DynamicRateLimiter from './services/rate-limiting/dynamic_rate_limiter_service';
import UploadFileRateLimit from './services/rate-limiting/maximum_file_upload_service';
import ClientRateLimiter from './services/rate-limiting/maximum_user_upload_service';
import FileUploadService from './services/file-handling/file_handler_service';
import HealthService from './services/system-health/health_service';
import AuthenticationService from './services/authentication/authentication_service';
import { logRequestId } from './helpers/logger/logger_attach_unique_id_helper';
import { createUser } from './services/authentication/user_registration_service';

dotenv.config();

const dynamicRateLimiter = new DynamicRateLimiter();
const uploadFileRateLimit = new UploadFileRateLimit(5);
const clientRateLimiter = new ClientRateLimiter();
const fileUploadService = new FileUploadService();
const healthService = new HealthService();
const authService = new AuthenticationService();

const app = express();
app.use(logRequestId);
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    await createUser(username, password);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error registering user, user might already exist' });
  }
});

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
