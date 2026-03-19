import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  platform: text('platform'), // 'ios' | 'android'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
