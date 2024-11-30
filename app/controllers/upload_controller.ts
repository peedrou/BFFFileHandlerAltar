import { Request, Response, Express } from 'express';
import AuthenticationService from '../services/authentication/authentication_service';
import ClientRateLimiterService from '../services/rate-limiting/maximum_user_upload_service';
import DynamicRateLimiterService from '../services/rate-limiting/dynamic_rate_limiter_service';
import UploadFileRateLimitService from '../services/rate-limiting/maximum_file_upload_service';
import FileUploadService from '../services/file-handling/file_handler_service';

class UploadController {
  constructor(
    app: Express,
    authService: AuthenticationService,
    clientRateLimiterService: ClientRateLimiterService,
    dynamicRateLimiterService: DynamicRateLimiterService,
    uploadFileRateLimitService: UploadFileRateLimitService,
    fileUploadService: FileUploadService,
  ) {
    app.post(
      '/upload',
      authService.basicAuthMiddleware,
      clientRateLimiterService.limit(),
      dynamicRateLimiterService.getRateLimiter(),
      uploadFileRateLimitService.limit(),
      (req: Request, res: Response) => {
        fileUploadService.handleFileUpload(req, res);
      },
    );
  }
}

export default UploadController;
