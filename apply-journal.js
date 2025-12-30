import mysql from 'mysql2/promise';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

async function apply() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const journalPath = './drizzle/meta/_journal.json';
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  
  console.log(`Found ${journal.entries.length} migrations in journal.`);
  
  for (const entry of journal.entries) {
    const filename = `${entry.tag}.sql`;
    const filePath = path.join('./drizzle', filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`Applying ${filename}...`);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    const statements = sql.split('--> statement-breakpoint');
    
    for (let statement of statements) {
      statement = statement.trim();
      if (!statement) continue;
      
      try {
        await connection.query(statement);
        console.log(`✓ Executed statement`);
      } catch (e) {
        if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME') {
             console.log(`~ Already exists/applied: ${e.message}`);
        } else {
             console.error(`✗ Failed: ${e.message}`);
             console.error(`Statement: ${statement}`);
        }
      }
    }
  }
  
  await connection.end();
  console.log('Done.');
}

apply();
