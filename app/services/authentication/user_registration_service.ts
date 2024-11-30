import bcrypt from 'bcrypt';
import CreateDBPoolService from '../database/database_pool_service';

class UserService {
  dbService: CreateDBPoolService;

  constructor(dbService: CreateDBPoolService) {
    this.dbService = dbService;
  }

  async createUser(username: string, plainTextPassword: string) {
    if (!this.dbService.connection) {
      throw Error('DB is not initiaized');
    }

    try {
      const [rows]: any = await this.dbService.connection.execute(
        'SELECT password FROM Users WHERE username = ?',
        [username],
      );

      if (rows.length > 0) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
      const [result] = await this.dbService.connection.execute(
        'INSERT INTO Users (username, password) VALUES (?, ?)',
        [username, hashedPassword],
      );
      return result;
    } catch (error) {
      console.error('Error inserting user:', error);
      throw error;
    }
  }
}

export default UserService;
