import { Request, Response, NextFunction } from 'express';
import basicAuth from 'basic-auth';
import bcrypt from 'bcrypt';
import CreateDBPoolService from '../database/database_pool_service';

class AuthenticationService {
  dbService: CreateDBPoolService;

  constructor(dbService: CreateDBPoolService) {
    this.dbService = dbService;
    this.basicAuthMiddleware = this.basicAuthMiddleware.bind(this);
  }

  public async basicAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const user = basicAuth(req);

    if (!user) {
      res.status(401).json({ message: 'No credentials provided' });
      return;
    }

    try {
      const resultSelect: any = await this.dbService.client.query(
        `SELECT password FROM Users WHERE username = '${user.name}'`,
      );

      if (resultSelect.rows.length === 0) {
        res.status(401).json({ message: 'Invalid username or password' });
        return;
      }

      const storedPassword = resultSelect.rows[0].password;
      const passwordMatch = await bcrypt.compare(user.pass, storedPassword);

      if (!passwordMatch) {
        res.status(401).json({ message: 'Invalid username or password' });
        return;
      }

      next();
    } catch (error) {
      console.error('Error authenticating user:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export default AuthenticationService;
