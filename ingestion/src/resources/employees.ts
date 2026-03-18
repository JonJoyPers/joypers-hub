import { eq } from 'drizzle-orm';
import { fetchAllPages } from '../deputyClient';
import { transformEmployee } from '../transform';
import type { DbClient } from '../db';
import { employees, locations } from '../../db-schema';

// Fields that can be edited in the web hub and should NOT be overwritten
// by Deputy if the local record was updated more recently.
const HUB_EDITABLE_FIELDS = new Set([
  'name',
  'firstName',
  'email',
  'role',
  'hireDate',
  'birthday',
  'avatarUrl',
  'department',
  'title',
]);

export async function ingestEmployees(db: DbClient, since?: string) {
  console.log('Ingesting employees...');

  const search = since ? { Modified: { gt: Math.floor(new Date(since).getTime() / 1000) } } : undefined;
  const raw = await fetchAllPages('Employee', search);

  // Build location deputy_id → id map for FK resolution
  const allLocations = await db.select().from(locations);
  const locationMap = new Map(allLocations.map(l => [l.deputyId, l.id]));

  let inserted = 0;
  let updated = 0;
  let skippedFields = 0;
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
        // Determine if the hub record was edited more recently than this Deputy record.
        // Deputy's Modified field is a Unix epoch (seconds).
        const deputyModified = record.Modified ? new Date(record.Modified * 1000) : null;
        const hubUpdatedAt = existing.updatedAt ? new Date(existing.updatedAt) : null;

        const hubIsNewer =
          hubUpdatedAt !== null &&
          deputyModified !== null &&
          hubUpdatedAt > deputyModified;

        if (hubIsNewer) {
          // Hub was edited after Deputy's last change — only sync Deputy-only fields
          // (is_active, deputy_id, location) and skip hub-editable fields.
          const safeRow: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(row)) {
            if (!HUB_EDITABLE_FIELDS.has(key)) {
              safeRow[key] = value;
            }
          }
          await db.update(employees).set(safeRow).where(eq(employees.deputyId, data.deputyId));
          skippedFields++;
        } else {
          // Deputy data is newer or no hub edits — update everything
          await db.update(employees).set(row).where(eq(employees.deputyId, data.deputyId));
        }
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

  console.log(`  Employees: ${inserted} inserted, ${updated} updated (${skippedFields} preserved hub edits), ${errors} errors`);
}
