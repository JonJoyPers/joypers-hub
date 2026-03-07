import { pgTable, serial, integer, uuid, date, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { locations } from './locations';

export const shiftTypeEnum = pgEnum('shift_type', [
  'opening', 'mid', 'closing', 'inventory', 'part_time',
]);

export const shifts = pgTable('shifts', {
  id: serial('id').primaryKey(),
  deputyId: integer('deputy_id').unique(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  locationId: integer('location_id').references(() => locations.id),
  date: date('date').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  type: shiftTypeEnum('type'),
  published: boolean('published').default(false),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
