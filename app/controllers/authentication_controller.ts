import { Request, Response, Express } from 'express';
import UserService from '../services/authentication/user_registration_service';

class AuthenticationController {
  constructor(app: Express, userService: UserService) {
    app.post('/register', async (req: Request, res: Response) => {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
      }

      try {
        await userService.createUser(username, password);
        res.status(201).json({ message: 'User registered successfully' });
      } catch (error) {
        res.status(500).json({
          message: 'Error registering user, user might already exist',
        });
      }
    });
  }
}

export default AuthenticationController;
