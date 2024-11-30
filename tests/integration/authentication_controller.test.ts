import request from 'supertest';
import express from 'express';
import dotenv from 'dotenv';
import CreateUserService from '../../app/services/authentication/user_registration_service';
import { logRequestId } from '../../app/helpers/logger/logger_attach_unique_id_helper';
import CreateDBPoolService from '../../app/services/database/database_pool_service';
import AuthenticationController from '../../app/controllers/authentication_controller';

dotenv.config();

// Services
const dbPoolService = new CreateDBPoolService();
const userService = new CreateUserService(dbPoolService);

// App
const app = express();
app.use(logRequestId);
app.use(express.json());

// Controllers
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

describe('Authentication', () => {
  it('should register a new user', async () => {
    let response = await request(app)
      .post('/register')
      .send({ username: 'hellouser', password: 'hellopassword' })
      .expect(201);

    expect(response.body.message).toBe('User registered successfully');
  });

  it('should register multiple users', async () => {
    await request(app)
      .post('/register')
      .send({ username: 'hellouser2', password: 'hellopassword' });

    const result = await dbPoolService.client.query('SELECT * from Users');
    expect(result.rowCount).toBe(2);
  });

  it('should fail to register a user if username is missing', async () => {
    const response = await request(app)
      .post('/register')
      .send({ password: 'password123' })
      .expect(400);

    expect(response.body.message).toBe('Username and password are required');
  });
});
