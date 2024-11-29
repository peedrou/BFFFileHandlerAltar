import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'authentication_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function createUser(username: string, plainTextPassword: string) {
  try {
    const [rows]: any = await pool.execute(
      'SELECT password FROM Users WHERE username = ?',
      [username],
    );
    if (rows.length > 0) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
    const [result] = await pool.execute(
      'INSERT INTO Users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
    );
    return result;
  } catch (error) {
    console.error('Error inserting user:', error);
    throw error;
  }
}
