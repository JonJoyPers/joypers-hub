import { pgTable, serial, integer, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const socialPosts = pgTable('social_posts', {
  id: serial('id').primaryKey(),
  authorId: uuid('author_id').notNull().references(() => employees.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const socialLikes = pgTable('social_likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique('social_likes_post_employee').on(table.postId, table.employeeId),
]);

export const socialComments = pgTable('social_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull().references(() => socialPosts.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => employees.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
