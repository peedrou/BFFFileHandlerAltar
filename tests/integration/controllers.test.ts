import request from 'supertest';
import path from 'path';
import FormData from 'form-data';
import fs from 'fs';
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import CreateUserService from '../../app/services/authentication/user_registration_service';
import AuthenticationService from '../../app/services/authentication/authentication_service';
import HealthService from '../../app/services/system-health/health_service';
import FileUploadService from '../../app/services/file-handling/file_handler_service';
import { logRequestId } from '../../app/helpers/logger/logger_attach_unique_id_helper';
import CreateDBPoolService from '../../app/services/database/database_pool_service';
import AuthenticationController from '../../app/controllers/authentication_controller';
import HealthController from '../../app/controllers/health_controller';
import UploadController from '../../app/controllers/upload_controller';
import DynamicRateLimiterService from '../../app/services/rate-limiting/dynamic_rate_limiter_service';
import UploadFileRateLimitService from '../../app/services/rate-limiting/maximum_file_upload_service';
import ClientRateLimiterService from '../../app/services/rate-limiting/maximum_user_upload_service';
import axios from 'axios';

dotenv.config();

const filePath = path.join(__dirname, '..', 'files', 'large_file.csv');

// Services
const dbPoolService = new CreateDBPoolService();
const dynamicRateLimiterService = new DynamicRateLimiterService();
const uploadFileRateLimitService = new UploadFileRateLimitService(5);
const clientRateLimiterService = new ClientRateLimiterService();
const fileUploadService = new FileUploadService();
const userService = new CreateUserService(dbPoolService);
const authService = new AuthenticationService(dbPoolService);
const healthService = new HealthService();

// App
const app = express();
app.use(logRequestId);
app.use(express.json());
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Controllers
new UploadController(
  app,
  authService,
  clientRateLimiterService,
  dynamicRateLimiterService,
  uploadFileRateLimitService,
  fileUploadService,
);
new AuthenticationController(app, userService);
new HealthController(app, healthService, ['https://www.google.com']);
new CreateUserService(dbPoolService);

beforeAll(async () => {
  try {
    await dbPoolService.client.connect();
    await dbPoolService.client.query('DELETE FROM users;');
  } catch (err) {
    console.log(err);
  }
});

// beforeEach(async () => {
//   try {
//     await dbPoolService.client.query('DELETE FROM users;');
//   } catch (err) {
//     console.log(err);
//   }
// });

afterAll(async () => {
  try {
    await dbPoolService.client.end();
  } catch (err) {
    console.log(err);
  }
});

describe('Controllers', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toHaveProperty('cpuUsage');
    expect(response.body).toHaveProperty('externalDependencies');
    expect(response.body).toHaveProperty('memoryUsage');
  });

  it('should register a new user', async () => {
    let response = await request(app)
      .post('/register')
      .send({ username: 'hellouser', password: 'hellopassword' })
      .expect(201);

    expect(response.body.message).toBe('User registered successfully');
  });

  it('should register multiple users', async () => {
    let response = await request(app)
      .post('/register')
      .send({ username: 'hellouser2', password: 'hellopassword' });

    expect(response.body.message).toBe('User registered successfully');

    response = await request(app)
      .post('/register')
      .send({ username: 'hellouser3', password: 'hellopassword' });

    expect(response.body.message).toBe('User registered successfully');
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
      .send({ file: filePath })
      .expect(401);

    expect(response.body.message).toBe('No credentials provided');
  });

  it('should upload file with correct authentication', async () => {
    const response = await request(app)
      .post('/upload')
      .auth('hellouser', 'hellopassword')
      .attach('file', filePath)
      .expect(200);

    expect(response.body.message).toBe('File uploaded successfully');
  });
});
