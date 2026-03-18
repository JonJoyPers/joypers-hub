import { eq } from 'drizzle-orm';
import { fetchAllPages } from '../deputyClient';
import { transformLocation } from '../transform';
import type { DbClient } from '../db';
import { locations } from '../../db-schema';

export async function ingestLocations(db: DbClient, since?: string) {
  console.log('Ingesting locations (Deputy "Company")...');

  // Company resource doesn't support Modified filter — always fetch all (few records)
  const raw = await fetchAllPages('Company');

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of raw) {
    try {
      const data = transformLocation(record);
      const existing = await db.query.locations.findFirst({
        where: eq(locations.deputyId, data.deputyId),
      });

      if (existing) {
        await db.update(locations).set(data).where(eq(locations.deputyId, data.deputyId));
        updated++;
      } else {
        await db.insert(locations).values(data);
        inserted++;
      }
    } catch (err) {
      console.error(`  Error ingesting location ${record.Id}:`, err);
      errors++;
    }
  }

  console.log(`  Locations: ${inserted} inserted, ${updated} updated, ${errors} errors`);
}
