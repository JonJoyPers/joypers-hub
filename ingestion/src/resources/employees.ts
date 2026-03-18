import { eq } from 'drizzle-orm';
import { fetchAllPages } from '../deputyClient';
import { transformEmployee } from '../transform';
import type { DbClient } from '../db';
import { employees, locations } from '../../db-schema';

export async function ingestEmployees(db: DbClient, since?: string) {
  console.log('Ingesting employees...');

  const search = since ? { Modified: { gt: Math.floor(new Date(since).getTime() / 1000) } } : undefined;
  const raw = await fetchAllPages('Employee', search);

  // Build location deputy_id → id map for FK resolution
  const allLocations = await db.select().from(locations);
  const locationMap = new Map(allLocations.map(l => [l.deputyId, l.id]));

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of raw) {
    try {
      const data = transformEmployee(record);
      const locationId = data.locationId ? locationMap.get(data.locationId) ?? null : null;

      const row = {
        ...data,
        locationId,
      };

      const existing = await db.query.employees.findFirst({
        where: eq(employees.deputyId, data.deputyId),
      });

      if (existing) {
        await db.update(employees).set(row).where(eq(employees.deputyId, data.deputyId));
        updated++;
      } else {
        await db.insert(employees).values(row);
        inserted++;
      }
    } catch (err) {
      console.error(`  Error ingesting employee ${record.Id}:`, err);
      errors++;
    }
  }

  console.log(`  Employees: ${inserted} inserted, ${updated} updated, ${errors} errors`);
}
