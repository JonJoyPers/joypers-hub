import { pgTable, serial, integer, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  deputyId: integer('deputy_id').unique(),
  name: text('name').notNull(),
  address: text('address'),
  timezone: text('timezone').default('America/Chicago'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
