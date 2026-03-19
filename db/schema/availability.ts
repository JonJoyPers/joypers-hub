import { pgTable, serial, uuid, integer, time, boolean } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const employeeAvailability = pgTable('employee_availability', {
  id: serial('id').primaryKey(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Mon, 1=Tue, ..., 6=Sun
  startTime: time('start_time'),
  endTime: time('end_time'),
  isAvailable: boolean('is_available').notNull().default(true),
});
