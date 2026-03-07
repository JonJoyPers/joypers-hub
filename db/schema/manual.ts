import { pgTable, serial, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const manualSections = pgTable('manual_sections', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().unique(),
  body: text('body'),
  version: integer('version').default(1),
  contentHash: text('content_hash'),
  updatedBy: uuid('updated_by').references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const manualAcknowledgments = pgTable('manual_acknowledgments', {
  id: serial('id').primaryKey(),
  sectionId: integer('section_id').notNull().references(() => manualSections.id),
  sectionVersion: integer('section_version').notNull(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
