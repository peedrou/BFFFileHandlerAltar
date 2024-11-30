import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import DynamicRateLimiterService from './services/rate-limiting/dynamic_rate_limiter_service';
import UploadFileRateLimitService from './services/rate-limiting/maximum_file_upload_service';
import ClientRateLimiterService from './services/rate-limiting/maximum_user_upload_service';
import FileUploadService from './services/file-handling/file_handler_service';
import HealthService from './services/system-health/health_service';
import AuthenticationService from './services/authentication/authentication_service';
import CreateDBPoolService from './services/database/database_pool_service';
import CreateUserService from './services/authentication/user_registration_service';
import { logRequestId } from './helpers/logger/logger_attach_unique_id_helper';
import AuthenticationController from './controllers/authentication_controller';
import HealthController from './controllers/health_controller';
import UploadController from './controllers/upload_controller';

dotenv.config();

// Services
const dbPoolService = new CreateDBPoolService();
const dynamicRateLimiter = new DynamicRateLimiterService();
const uploadFileRateLimit = new UploadFileRateLimitService(5);
const clientRateLimiter = new ClientRateLimiterService();
const fileUploadService = new FileUploadService();
const healthService = new HealthService();
const userService = new CreateUserService(dbPoolService);
const authService = new AuthenticationService(dbPoolService);

// App

const app = express();
app.use(logRequestId);
app.use(express.json());

// Controllers
new AuthenticationController(app, userService);
new HealthController(app, healthService, ['https://www.google.com']);
new UploadController(
  app,
  authService,
  clientRateLimiter,
  dynamicRateLimiter,
  uploadFileRateLimit,
  fileUploadService,
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
