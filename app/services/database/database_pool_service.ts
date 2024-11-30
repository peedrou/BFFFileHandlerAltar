import { Client } from 'pg';

class CreateDBPoolService {
  client: Client;

  constructor() {
    this.client = new Client({
      user: 'root',
      password: 'secret',
      host: 'localhost',
      port: 5432,
      database: 'database_test',
    });
    this.client.connect();
  }
}

export default CreateDBPoolService;
