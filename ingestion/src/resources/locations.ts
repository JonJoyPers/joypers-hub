import { eq } from 'drizzle-orm';
import { fetchAllPages } from '../deputyClient';
import { transformLocation } from '../transform';
import type { DbClient } from '../db';
import { locations } from '../../db-schema';

export async function ingestLocations(db: DbClient, since?: string) {
  console.log('Ingesting locations (Deputy "Company")...');

  const search = since ? { Modified: { gt: since } } : undefined;
  const raw = await fetchAllPages('Company', search);

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
