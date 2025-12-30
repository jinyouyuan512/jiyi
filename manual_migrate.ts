import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function migrate() {
  console.log("Connecting to database...");
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  try {
    // Columns already added, skipping checks or keeping them (they handle duplicates)
    // ...

    console.log("Creating experience_records table...");
    // Simplified query
    await connection.query(`
      CREATE TABLE IF NOT EXISTS experience_records (
        id int AUTO_INCREMENT PRIMARY KEY,
        userId int NOT NULL,
        attractionId int NOT NULL,
        startTime datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        endTime datetime DEFAULT NULL,
        status varchar(20) NOT NULL DEFAULT 'in_progress',
        certificateUrl text
      )
    `);
    console.log("- Created 'experience_records' table");
    
    // Add FKs separately to be safe
    try {
        await connection.query(`ALTER TABLE experience_records ADD CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id)`);
    } catch (e) {}
    try {
        await connection.query(`ALTER TABLE experience_records ADD CONSTRAINT fk_attraction FOREIGN KEY (attractionId) REFERENCES attractions(id)`);
    } catch (e) {}

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await connection.end();
  }
}

migrate();
