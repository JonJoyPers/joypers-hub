import { pgTable, serial, integer, uuid, text, date, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { employees } from './employees';

export const leaveStatusEnum = pgEnum('leave_status', [
  'pending', 'approved', 'declined', 'cancelled',
]);

export const leaveTypes = pgTable('leave_types', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  accrualRate: numeric('accrual_rate'),
  maxBalance: numeric('max_balance'),
});

export const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  deputyId: integer('deputy_id').unique(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  leaveTypeId: integer('leave_type_id').notNull().references(() => leaveTypes.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  hours: numeric('hours'),
  status: leaveStatusEnum('status').default('pending'),
  reason: text('reason'),
  reviewedBy: uuid('reviewed_by').references(() => employees.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const leaveLedger = pgTable('leave_ledger', {
  id: serial('id').primaryKey(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  leaveTypeId: integer('leave_type_id').notNull().references(() => leaveTypes.id),
  deltaHours: numeric('delta_hours').notNull(),
  reason: text('reason'),
  referenceId: integer('reference_id').references(() => leaveRequests.id),
  effectiveDate: date('effective_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
