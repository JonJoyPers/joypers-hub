import { eq } from 'drizzle-orm';
import { fetchAllPages } from '../deputyClient';
import { transformRoster } from '../transform';
import type { DbClient } from '../db';
import { shifts, employees, locations } from '../../db-schema';

export async function ingestShifts(db: DbClient, since?: string) {
  console.log('Ingesting shifts (Deputy "Roster")...');

  const search = since ? { Modified: { gt: Math.floor(new Date(since).getTime() / 1000) } } : undefined;
  const raw = await fetchAllPages('Roster', search);

  // Build lookup maps
  const allEmployees = await db.select({ id: employees.id, deputyId: employees.deputyId }).from(employees);
  const empMap = new Map(allEmployees.filter(e => e.deputyId).map(e => [e.deputyId!, e.id]));

  const allLocations = await db.select({ id: locations.id, deputyId: locations.deputyId }).from(locations);
  const locMap = new Map(allLocations.filter(l => l.deputyId).map(l => [l.deputyId!, l.id]));

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of raw) {
    try {
      const data = transformRoster(record);
      const employeeId = empMap.get(data.employeeDeputyId);
      if (!employeeId) {
        console.warn(`  Skipping shift ${record.Id}: unknown employee deputy_id ${data.employeeDeputyId}`);
        continue;
      }

      if (!data.date || !data.startTime || !data.endTime) {
        console.warn(`  Skipping shift ${record.Id}: missing date or start/end time`);
        continue;
      }

      const row = {
        deputyId: data.deputyId as number,
        employeeId,
        locationId: data.locationDeputyId ? locMap.get(data.locationDeputyId) ?? null : null,
        date: data.date,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        type: data.type,
        published: data.published,
        createdBy: data.creatorDeputyId ? empMap.get(data.creatorDeputyId) ?? null : null,
      };

      const existing = await db.query.shifts.findFirst({
        where: eq(shifts.deputyId, data.deputyId),
      });

      if (existing) {
        const { deputyId: _, ...updateData } = row;
        await db.update(shifts).set(updateData).where(eq(shifts.deputyId, data.deputyId));
        updated++;
      } else {
        await db.insert(shifts).values(row);
        inserted++;
      }
    } catch (err) {
      console.error(`  Error ingesting shift ${record.Id}:`, err);
      errors++;
    }
  }

  console.log(`  Shifts: ${inserted} inserted, ${updated} updated, ${errors} errors`);
}
