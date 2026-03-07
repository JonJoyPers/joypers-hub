import { eq } from 'drizzle-orm';
import { fetchAllPages } from '../deputyClient';
import { transformTimesheet } from '../transform';
import type { DbClient } from '../db';
import { punches, employees } from '../../db-schema';

export async function ingestTimesheets(db: DbClient, since?: string) {
  console.log('Ingesting timesheets...');

  const search = since ? { Modified: { gt: since } } : undefined;
  const raw = await fetchAllPages('Timesheet', search);

  // Build employee lookup
  const allEmployees = await db.select({ id: employees.id, deputyId: employees.deputyId }).from(employees);
  const empMap = new Map(allEmployees.filter(e => e.deputyId).map(e => [e.deputyId!, e.id]));

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of raw) {
    try {
      const punchRows = transformTimesheet(record);

      for (const punch of punchRows) {
        const employeeId = empMap.get(punch.employeeDeputyId);
        if (!employeeId) {
          console.warn(`  Skipping punch: unknown employee deputy_id ${punch.employeeDeputyId}`);
          continue;
        }

        if (!punch.timestamp) continue;

        const row = {
          deputyId: punch.deputyId,
          employeeId,
          type: punch.type,
          timestamp: new Date(punch.timestamp),
        };

        const existing = await db.query.punches.findFirst({
          where: eq(punches.deputyId, punch.deputyId),
        });

        if (existing) {
          await db.update(punches).set(row).where(eq(punches.deputyId, punch.deputyId));
          updated++;
        } else {
          await db.insert(punches).values(row as any);
          inserted++;
        }
      }
    } catch (err) {
      console.error(`  Error ingesting timesheet ${record.Id}:`, err);
      errors++;
    }
  }

  console.log(`  Punches: ${inserted} inserted, ${updated} updated, ${errors} errors`);
}
