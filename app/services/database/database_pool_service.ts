import mysql from 'mysql2/promise';

class CreateDBPoolService {
  connection: mysql.Connection | null;

  constructor() {
    this.connection = null;
    this.init();
  }

  async init() {
    if (!this.connection)
      this.connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'authentication_db',
      });
  }
}

export default CreateDBPoolService;
