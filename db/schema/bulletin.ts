import { pgTable, serial, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const bulletinPosts = pgTable('bulletin_posts', {
  id: serial('id').primaryKey(),
  title: text('title'),
  body: text('body'),
  type: text('type'),
  emoji: text('emoji'),
  tags: text('tags').array(),
  pinned: boolean('pinned').default(false),
  authorId: uuid('author_id').references(() => employees.id),
  eventDate: timestamp('event_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
