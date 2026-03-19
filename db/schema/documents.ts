import { pgTable, serial, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const docStatusEnum = pgEnum('doc_status', ['not_sent', 'sent', 'completed']);

export const employeeDocuments = pgTable('employee_documents', {
  id: serial('id').primaryKey(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  docType: text('doc_type').notNull(), // e.g. 'w4', 'i9', 'w2', 'direct_deposit', 'handbook_ack'
  label: text('label').notNull(),
  status: docStatusEnum('status').notNull().default('not_sent'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
