/**
 * @fileoverview AI and chat schema - AI insights, chat conversations, NLU
 * @module db/schema/ai
 */

import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * AI insights - AI-generated financial recommendations
 */
export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  insightType: text('insight_type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity').default('info'), // info, warning, critical, success
  category: text('category'),
  amount: numeric('amount'),
  percentageChange: numeric('percentage_change'),
  comparisonPeriod: text('comparison_period'),
  relatedEntities: jsonb('related_entities').default(sql`'[]'::jsonb`),
  actionSuggested: text('action_suggested'),
  actionUrl: text('action_url'),
  isRead: boolean('is_read').default(false),
  isDismissed: boolean('is_dismissed').default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  confidenceScore: numeric('confidence_score'),
  modelVersion: text('model_version').default('1.0'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * Chat conversations - AI chat sessions
 */
export const chatConversations = pgTable('chat_conversations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  messageCount: integer('message_count').default(0),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
});

/**
 * Chat messages - Individual messages in conversations
 */
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => chatConversations.id),
  role: text('role').notNull(), // user, assistant, system
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  attachments: jsonb('attachments').default(sql`'[]'::jsonb`),
  reasoning: text('reasoning'),
});

/**
 * Chat context snapshots - Financial context for AI
 */
export const chatContextSnapshots = pgTable('chat_context_snapshots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => chatConversations.id),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  recentTransactions: jsonb('recent_transactions').default(sql`'[]'::jsonb`),
  accountBalances: jsonb('account_balances').default(sql`'[]'::jsonb`),
  upcomingEvents: jsonb('upcoming_events').default(sql`'[]'::jsonb`),
  userPreferences: jsonb('user_preferences').default(sql`'{}'::jsonb`),
  contextVersion: integer('context_version').default(1),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
});

/**
 * Conversation contexts - NLU context tracking
 */
export const conversationContexts = pgTable('conversation_contexts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  sessionId: text('session_id').notNull(),
  history: jsonb('history').default(sql`'[]'::jsonb`),
  lastEntities: jsonb('last_entities').default(sql`'[]'::jsonb`),
  lastIntent: text('last_intent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).default(sql`now()`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

/**
 * NLU learning data - Continuous improvement data
 */
export const nluLearningData = pgTable('nlu_learning_data', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  originalText: text('original_text').notNull(),
  errorPattern: text('error_pattern').notNull(),
  correctionApplied: text('correction_applied').notNull(),
  success: boolean('success').notNull(),
  confidenceImprovement: numeric('confidence_improvement').notNull(),
  originalConfidence: numeric('original_confidence').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).default(sql`now()`),
  linguisticStyle: text('linguistic_style'),
  regionalVariation: text('regional_variation'),
  userFeedback: text('user_feedback'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// Type exports
export type AiInsight = typeof aiInsights.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ConversationContext = typeof conversationContexts.$inferSelect;
export type NluLearningData = typeof nluLearningData.$inferSelect;
