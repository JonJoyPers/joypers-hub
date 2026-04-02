import { pgTable, serial, integer, uuid, text, date, timestamp, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const timesheetStatusEnum = pgEnum('timesheet_status', [
  'pending', 'approved', 'disputed', 'exported',
]);

export const timesheets = pgTable('timesheets', {
  id: serial('id').primaryKey(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  date: date('date').notNull(),
  clockIn: timestamp('clock_in', { withTimezone: true }),
  clockOut: timestamp('clock_out', { withTimezone: true }),
  workedMinutes: integer('worked_minutes').default(0),
  breakMinutes: integer('break_minutes').default(0),
  lunchMinutes: integer('lunch_minutes').default(0),
  hasOpenPunch: boolean('has_open_punch').default(false),
  status: timesheetStatusEnum('status').notNull().default('pending'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  managerNote: text('manager_note'),
  employeeNote: text('employee_note'),
  payRateSnapshot: numeric('pay_rate_snapshot'),
  payAmount: numeric('pay_amount'),
  exportBatchId: integer('export_batch_id'),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const exportBatches = pgTable('export_batches', {
  id: serial('id').primaryKey(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  totalHours: numeric('total_hours'),
  totalAmount: numeric('total_amount'),
  employeeCount: integer('employee_count'),
  exportedBy: uuid('exported_by').references(() => employees.id),
  exportedAt: timestamp('exported_at', { withTimezone: true }).defaultNow(),
  format: text('format'),
  notes: text('notes'),
});
