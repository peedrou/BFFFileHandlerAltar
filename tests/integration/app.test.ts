import request from 'supertest';
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { createUser } from '../../app/services/authentication/user_registration_service';
import AuthenticationService from '../../app/services/authentication/authentication_service';
import HealthService from '../../app/services/system-health/health_service';
import FileUploadService from '../../app/services/file-handling/file_handler_service';
import { logRequestId } from '../../app/helpers/logger/logger_attach_unique_id_helper';
import DynamicRateLimiter from '../../app/services/rate-limiting/dynamic_rate_limiter_service';
import UploadFileRateLimit from '../../app/services/rate-limiting/maximum_file_upload_service';
import ClientRateLimiter from '../../app/services/rate-limiting/maximum_user_upload_service';

dotenv.config();

const dynamicRateLimiter = new DynamicRateLimiter();
const uploadFileRateLimit = new UploadFileRateLimit(5);
const clientRateLimiter = new ClientRateLimiter();
const fileUploadService = new FileUploadService();
const healthService = new HealthService();
const authService = new AuthenticationService();

const app: Express = express();
app.use(logRequestId);
app.use(express.json());

app.post('/register', async (req: any, res: any) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  try {
    await createUser(username, password);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthService.getHealth(['https://www.google.com']);
    res.status(200).json(health);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve health information.' });
  }
});

app.post(
  '/upload',
  authService.basicAuthMiddleware,
  clientRateLimiter.limit(),
  dynamicRateLimiter.getRateLimiter(),
  uploadFileRateLimit.limit(),
  (req: Request, res: Response) => {
    fileUploadService.handleFileUpload(req, res);
  },
);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

describe('Integration Tests', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/register')
      .send({ username: 'hellouser', password: 'hellopassword' })
      .expect(201);

    expect(response.body.message).toBe('User registered successfully');
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toHaveProperty('cpuUsage');
    expect(response.body).toHaveProperty('externalDependencies');
    expect(response.body).toHaveProperty('memoryUsage');
  });

  it('should fail to register a user if username is missing', async () => {
    const response = await request(app)
      .post('/register')
      .send({ password: 'password123' })
      .expect(400);

    expect(response.body.message).toBe('Username and password are required');
  });

  it('should fail to upload file due to authentication', async () => {
    const response = await request(app)
      .post('/upload')
      .send({ file: 'filedata' })
      .expect(401);

    expect(response.body.message).toBe('No credentials provided');
  });

  it('should upload file with correct authentication', async () => {
    const response = await request(app)
      .post('/upload')
      .auth('hellouser', 'hellopassword')
      .send({ file: 'filedata' })
      .expect(200);

    expect(response.body.message).toBe('File uploaded successfully');
  });
});
