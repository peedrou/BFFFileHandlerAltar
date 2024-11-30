import request from 'supertest';
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

dotenv.config();

// Services
const dbPoolService = new CreateDBPoolService();
const dynamicRateLimiterService = new DynamicRateLimiterService();
const uploadFileRateLimitService = new UploadFileRateLimitService(5);
const clientRateLimiterService = new ClientRateLimiterService();
const fileUploadService = new FileUploadService();
const userService = new CreateUserService(dbPoolService);
const authService = new AuthenticationService(dbPoolService);

// App
const app = express();
app.use(logRequestId);
app.use(express.json());

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
new CreateUserService(dbPoolService);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

beforeAll(async () => {
  try {
    await dbPoolService.client.connect();
    await dbPoolService.client.query('DELETE FROM users;');
  } catch (err) {
    console.log(err);
  }
});

afterAll(async () => {
  try {
    await dbPoolService.client.end();
  } catch (err) {
    console.log(err);
  }
});

describe('Upload', () => {
  it('should fail to upload file due to authentication', async () => {
    let response = await request(app)
      .post('/register')
      .send({ username: 'hellouser', password: 'hellopassword' })
      .expect(201);

    expect(response.body.message).toBe('User registered successfully');

    response = await request(app)
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
      .expect(201);

    expect(response.body.message).toBe('File uploaded successfully');
  });
});
