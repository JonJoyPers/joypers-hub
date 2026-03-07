import { pgTable, uuid, integer, text, boolean, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { locations } from './locations';

export const roleEnum = pgEnum('employee_role', ['admin', 'manager', 'employee']);
export const workerTypeEnum = pgEnum('worker_type', ['in_store', 'remote']);

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  deputyId: integer('deputy_id').unique(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  email: text('email').unique(),
  pin: text('pin'),
  role: roleEnum('role').notNull().default('employee'),
  department: text('department'),
  title: text('title'),
  workerType: workerTypeEnum('worker_type').default('in_store'),
  locationId: integer('location_id').references(() => locations.id),
  hireDate: date('hire_date'),
  birthday: date('birthday'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
