import { Request, Response, NextFunction } from 'express';
import basicAuth from 'basic-auth';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

class AuthenticationService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'authentication_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  public async basicAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const user = basicAuth(req);

    if (!user) {
      return res.status(401).json({ message: 'No credentials provided' });
    }

    try {
      const [rows]: any = await this.pool.execute(
        'SELECT password FROM Users WHERE username = ?',
        [user.name],
      );

      if (rows.length === 0) {
        return res
          .status(401)
          .json({ message: 'Invalid username or password' });
      }

      const storedPassword = rows[0].password;
      const passwordMatch = await bcrypt.compare(user.pass, storedPassword);

      if (!passwordMatch) {
        return res
          .status(401)
          .json({ message: 'Invalid username or password' });
      }

      next();
    } catch (error) {
      console.error('Error authenticating user:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}

export default AuthenticationService;
