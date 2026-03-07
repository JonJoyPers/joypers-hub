import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createDb } from './db';
import { employees } from '../../db/schema/index';
import { eq } from 'drizzle-orm';

const SUPABASE_URL = 'https://zxbudjlnsgtjnocatwks.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = 'JoyPers2024!';

async function main() {
  const db = createDb();

  // Get all active employees with emails
  const emps = await db
    .select({ id: employees.id, name: employees.name, email: employees.email, role: employees.role })
    .from(employees)
    .where(eq(employees.isActive, true));

  console.log(`Found ${emps.length} active employees\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const emp of emps) {
    if (!emp.email) {
      console.log(`  SKIP ${emp.name} — no email`);
      skipped++;
      continue;
    }

    // Create auth user with the SAME UUID as the employee record
    const { data, error } = await supabase.auth.admin.createUser({
      id: emp.id,
      email: emp.email,
      password: DEFAULT_PASSWORD,
      email_confirm: true, // Skip email verification
      user_metadata: { name: emp.name, role: emp.role },
    });

    if (error) {
      if (error.message.includes('already been registered') || error.message.includes('already exists')) {
        console.log(`  EXISTS ${emp.name} (${emp.email})`);
        skipped++;
      } else {
        console.log(`  ERROR ${emp.name} (${emp.email}): ${error.message}`);
        errors++;
      }
      continue;
    }

    console.log(`  CREATED ${emp.name} (${emp.email}) → ${data.user.id}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped, ${errors} errors`);
  console.log(`\nDefault password for all users: ${DEFAULT_PASSWORD}`);
  console.log('Users should change their password after first login.');

  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
