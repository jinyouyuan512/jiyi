import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const sql = fs.readFileSync('./drizzle/0001_add_new_tables.sql', 'utf-8');
const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));

console.log(`Executing ${statements.length} SQL statements...`);

for (const statement of statements) {
  try {
    await connection.query(statement);
    console.log('✓ Executed:', statement.substring(0, 60) + '...');
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
      console.log('⊙ Already exists:', statement.substring(0, 60) + '...');
    } else {
      console.error('✗ Error:', error.message);
      console.error('Statement:', statement);
    }
  }
}

await connection.end();
console.log('\nMigration complete!');
