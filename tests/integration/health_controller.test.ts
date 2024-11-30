import request from 'supertest';
import express from 'express';
import HealthService from '../../app/services/system-health/health_service';
import { logRequestId } from '../../app/helpers/logger/logger_attach_unique_id_helper';
import HealthController from '../../app/controllers/health_controller';

const app = express();
app.use(logRequestId);
app.use(express.json());

const healthService = new HealthService();

new HealthController(app, healthService, ['https://www.google.com']);

// app.listen(3000, () => {
//   console.log('Server is running on port 3000');
// });

describe('Health', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toHaveProperty('cpuUsage');
    expect(response.body).toHaveProperty('externalDependencies');
    expect(response.body).toHaveProperty('memoryUsage');
  });
});
