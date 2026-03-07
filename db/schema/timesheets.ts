import { pgTable, serial, integer, uuid, text, timestamp, point, pgEnum } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const punchTypeEnum = pgEnum('punch_type', [
  'clock_in', 'clock_out', 'break_start', 'break_end', 'lunch_start', 'lunch_end',
]);

export const punches = pgTable('punches', {
  id: serial('id').primaryKey(),
  deputyId: integer('deputy_id').unique(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  type: punchTypeEnum('type').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  location: point('location', { mode: 'xy' }),
  photoUrl: text('photo_url'),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
