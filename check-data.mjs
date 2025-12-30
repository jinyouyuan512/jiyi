import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { routes } from './drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await db.select().from(routes).limit(1);
console.log('Sample route data:');
console.log(JSON.stringify(result[0], null, 2));
console.log('\nTags type:', typeof result[0]?.tags);
console.log('Tags value:', result[0]?.tags);

await connection.end();
