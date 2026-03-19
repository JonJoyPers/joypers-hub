import { pgTable, serial, uuid, integer, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { employees } from './employees';

export const academyModules = pgTable('academy_modules', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const academyVideos = pgTable('academy_videos', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => academyModules.id),
  title: text('title').notNull(),
  url: text('url').notNull(),
  duration: text('duration'),
  source: text('source'),
  sortOrder: integer('sort_order').default(0),
});

export const academyQuizzes = pgTable('academy_quizzes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const academyQuestions = pgTable('academy_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id').references(() => academyQuizzes.id),
  question: text('question').notNull(),
  options: jsonb('options').notNull(),
  correctIndex: integer('correct_index').notNull(),
  sortOrder: integer('sort_order').default(0),
});

export const academyScores = pgTable('academy_scores', {
  id: serial('id').primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id),
  quizId: integer('quiz_id').references(() => academyQuizzes.id),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
});
