import { eq } from 'drizzle-orm';
import { fetchAllPages } from '../deputyClient';
import { transformLeave } from '../transform';
import type { DbClient } from '../db';
import { leaveRequests, leaveLedger, leaveTypes, employees } from '../../db-schema';

export async function ingestLeave(db: DbClient, since?: string) {
  console.log('Ingesting leave requests...');

  const search = since ? { Modified: { gt: since } } : undefined;
  const raw = await fetchAllPages('Leave', search);

  // Build employee lookup
  const allEmployees = await db.select({ id: employees.id, deputyId: employees.deputyId }).from(employees);
  const empMap = new Map(allEmployees.filter(e => e.deputyId).map(e => [e.deputyId!, e.id]));

  // Build leave type lookup (by name) and cache for auto-creation
  const allLeaveTypes = await db.select({ id: leaveTypes.id, name: leaveTypes.name }).from(leaveTypes);
  const leaveTypeMap = new Map(allLeaveTypes.map(lt => [lt.name.toLowerCase(), lt.id]));

  async function resolveLeaveTypeId(ruleName: string | null): Promise<number> {
    const name = ruleName?.trim() || 'General';
    const key = name.toLowerCase();
    const existing = leaveTypeMap.get(key);
    if (existing) return existing;

    // Auto-create the leave type
    const [created] = await db.insert(leaveTypes).values({ name }).returning();
    leaveTypeMap.set(key, created.id);
    console.log(`  Auto-created leave type: "${name}" (id=${created.id})`);
    return created.id;
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const record of raw) {
    try {
      const data = transformLeave(record);
      const employeeId = empMap.get(data.employeeDeputyId);
      if (!employeeId) {
        console.warn(`  Skipping leave ${record.Id}: unknown employee deputy_id ${data.employeeDeputyId}`);
        continue;
      }

      if (!data.startDate || !data.endDate) {
        console.warn(`  Skipping leave ${record.Id}: missing start/end date`);
        continue;
      }

      const leaveTypeId = await resolveLeaveTypeId(data.leaveRuleName);

      const row = {
        deputyId: data.deputyId as number,
        employeeId,
        leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        hours: data.hours,
        status: data.status,
        reason: data.reason,
        reviewedBy: data.approvedByDeputyId ? empMap.get(data.approvedByDeputyId) ?? null : null,
        reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : null,
      };

      const existing = await db.query.leaveRequests.findFirst({
        where: eq(leaveRequests.deputyId, data.deputyId),
      });

      if (existing) {
        const { deputyId: _, ...updateData } = row;
        await db.update(leaveRequests).set(updateData).where(eq(leaveRequests.deputyId, data.deputyId));
        updated++;
      } else {
        const [inserted_row] = await db.insert(leaveRequests).values(row).returning();
        inserted++;

        // If approved, create a ledger entry for the deduction
        if (data.status === 'approved' && data.hours) {
          await db.insert(leaveLedger).values({
            employeeId,
            leaveTypeId,
            deltaHours: String(-Math.abs(Number(data.hours))),
            reason: 'approved_leave',
            referenceId: inserted_row.id,
            effectiveDate: data.startDate!,
          });
        }
      }
    } catch (err) {
      console.error(`  Error ingesting leave ${record.Id}:`, err);
      errors++;
    }
  }

  console.log(`  Leave requests: ${inserted} inserted, ${updated} updated, ${errors} errors`);
}
