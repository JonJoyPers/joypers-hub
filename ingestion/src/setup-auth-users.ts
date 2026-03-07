import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const SUPABASE_URL = 'https://zxbudjlnsgtjnocatwks.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = postgres(DATABASE_URL);

const DEFAULT_PASSWORD = 'JoyPers2024!';

async function main() {
  // 1. List current state
  const emps = await sql`SELECT id, name, first_name, email, role, is_active, deputy_id FROM employees ORDER BY name`;
  console.log('=== ALL EMPLOYEES ===');
  for (const e of emps) {
    console.log(`  ${e.is_active ? '✓' : '✗'} ${e.name} | email: ${e.email || 'NONE'} | role: ${e.role} | deputy_id: ${e.deputy_id || 'NONE'}`);
  }
  console.log(`Total: ${emps.length}\n`);

  // 2. Delete ALL existing auth users (clean slate)
  console.log('=== REMOVING EXISTING AUTH USERS ===');
  const { data: authData } = await supabase.auth.admin.listUsers();
  const existingUsers = authData?.users || [];
  for (const u of existingUsers) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) {
      console.log(`  ERROR deleting ${u.email}: ${error.message}`);
    } else {
      console.log(`  DELETED auth user: ${u.email}`);
    }
  }
  console.log(`Removed ${existingUsers.length} auth user(s)\n`);

  // 3. Generate emails for employees that don't have one
  //    Format: firstname@joypers.com (lowercase, no spaces)
  console.log('=== CREATING AUTH USERS ===');
  let created = 0;
  let errors = 0;

  for (const emp of emps) {
    // Generate email if missing
    let email = emp.email;
    if (!email) {
      // Use first name, strip parenthetical prefixes like "(A) Andrew" → "andrew"
      const cleanName = emp.name.replace(/^\([A-Z]\)\s*/, '').trim();
      const firstName = cleanName.split(' ')[0].toLowerCase();
      email = `${firstName}@joypers.com`;

      // Update employee record with the email
      await sql`UPDATE employees SET email = ${email} WHERE id = ${emp.id}`;
    }

    // Create Supabase Auth user with same UUID as employee
    const { data, error } = await supabase.auth.admin.createUser({
      id: emp.id,
      email: email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name: emp.name, role: emp.role, must_change_password: true },
    });

    if (error) {
      // Handle duplicate emails — append a number
      if (error.message.includes('already been registered') || error.message.includes('unique')) {
        const altEmail = email.replace('@', `${Math.floor(Math.random() * 99)}@`);
        await sql`UPDATE employees SET email = ${altEmail} WHERE id = ${emp.id}`;
        const retry = await supabase.auth.admin.createUser({
          id: emp.id,
          email: altEmail,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { name: emp.name, role: emp.role, must_change_password: true },
        });
        if (retry.error) {
          console.log(`  ERROR ${emp.name}: ${retry.error.message}`);
          errors++;
        } else {
          console.log(`  CREATED ${emp.name} → ${altEmail}`);
          created++;
        }
      } else {
        console.log(`  ERROR ${emp.name}: ${error.message}`);
        errors++;
      }
      continue;
    }

    console.log(`  CREATED ${emp.name} → ${email} (${emp.is_active ? 'active' : 'inactive'})`);
    created++;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Created: ${created}`);
  console.log(`Errors: ${errors}`);
  console.log(`Default password: ${DEFAULT_PASSWORD}`);

  // 4. Print final employee list with emails
  const final = await sql`SELECT name, email, role, is_active FROM employees ORDER BY name`;
  console.log('\n=== FINAL EMPLOYEE LIST ===');
  for (const e of final) {
    console.log(`  ${e.is_active ? '✓' : '✗'} ${e.name} | ${e.email} | ${e.role}`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
