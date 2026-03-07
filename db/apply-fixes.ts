import postgres from 'postgres';
import { readFileSync } from 'fs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const sql = postgres(connectionString, { max: 1 });

async function main() {
  // Apply schema fixes
  const fixes = readFileSync('./migrations/0001_schema_fixes.sql', 'utf-8');
  console.log('Applying schema fixes...');
  await sql.unsafe(fixes);
  console.log('Schema fixes applied.');

  // Apply RLS policies (skip if they already exist)
  const rls = readFileSync('./rls-policies.sql', 'utf-8');
  console.log('Applying RLS policies...');
  try {
    await sql.unsafe(rls);
    console.log('RLS policies applied.');
  } catch (err: any) {
    if (err.code === '42710') {
      console.log('RLS policies already exist — skipping.');
    } else {
      throw err;
    }
  }

  // Apply views (CREATE OR REPLACE is safe to rerun)
  const views = readFileSync('./create-views.sql', 'utf-8');
  console.log('Applying views...');
  await sql.unsafe(views);
  console.log('Views applied.');

  await sql.end();
  console.log('All done!');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
