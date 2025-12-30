import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { attractions } from "../drizzle/schema";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

async function checkData() {
  console.log("Connecting to database...");
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  try {
    const results = await db.select().from(attractions);
    console.log(`Found ${results.length} attractions.`);
    if (results.length > 0) {
      console.log("Sample attraction:", results[0].name, results[0].latitude, results[0].longitude);
    } else {
        console.log("No attractions found. Please run seed script.");
    }
  } catch (error) {
    console.error("Error querying data:", error);
  } finally {
    await connection.end();
  }
}

checkData();
