import bcrypt from 'bcrypt';
import CreateDBPoolService from '../database/database_pool_service';

class UserService {
  dbService: CreateDBPoolService;

  constructor(dbService: CreateDBPoolService) {
    this.dbService = dbService;
  }

  async createUser(username: string, plainTextPassword: string) {
    try {
      const resultQuery = await this.dbService.client.query(
        `SELECT password FROM Users WHERE username = '${username}'`,
      );

      console.log('resultQuery.rows', resultQuery.rows);

      if (resultQuery.rows.length > 0) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
      const resultInsert = await this.dbService.client.query(
        `INSERT INTO Users (username, password) VALUES ('${username}', '${hashedPassword}')`,
      );

      return resultInsert.rows;
    } catch (error) {
      console.error('Error inserting user:', error);
      throw error;
    }
  }
}

export default UserService;
