import { pgTable, serial, integer, uuid, date, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { locations } from './locations';

export const storeClosures = pgTable('store_closures', {
  id: serial('id').primaryKey(),
  locationId: integer('location_id').references(() => locations.id),
  date: date('date').notNull(),
  reason: text('reason').notNull(),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.locationId, table.date),
]);
