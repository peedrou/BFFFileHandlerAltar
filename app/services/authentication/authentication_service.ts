import { Request, Response, NextFunction } from 'express';
import basicAuth from 'basic-auth';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

class AuthenticationService {
  pool: mysql.Pool;

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
      const [rows]: any = await this.pool.execute(
        'SELECT password FROM Users WHERE username = ?',
        [user.name],
      );

      if (rows.length === 0) {
        res.status(401).json({ message: 'Invalid username or password' });
        return;
      }

      const storedPassword = rows[0].password;
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
