/**
 * Voice & AI Schema - Voice Commands, Intents, and AI Features
 *
 * Drizzle ORM with NeonDB (PostgreSQL Serverless)
 * Voice commands, AI insights, spending patterns, and budgets
 */

import {
	boolean,
	date,
	decimal,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';

import { transactionCategories } from './transactions';
import { users } from './users';

// ========================================
// VOICE COMMANDS
// ========================================

/**
 * Voice command history for AI training and analytics
 */
export const voiceCommands = pgTable('voice_commands', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Command data
	commandText: text('command_text').notNull(),
	audioFileUrl: text('audio_file_url'),

	// Intent recognition
	intent: text('intent').notNull(),
	intentConfidence: decimal('intent_confidence', { precision: 3, scale: 2 }),
	entities: jsonb('entities'), // Extracted entities from NLP

	// Response
	responseText: text('response_text'),
	responseAudioUrl: text('response_audio_url'),

	// Performance
	processingTimeMs: integer('processing_time_ms'),

	// Status
	status: text('status').default('processed'), // processed, failed, cancelled
	errorMessage: text('error_message'),

	// Context
	context: jsonb('context'), // Previous conversation context

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// COMMAND INTENTS
// ========================================

/**
 * Intent patterns for voice command processing
 */
export const commandIntents = pgTable('command_intents', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),

	// Intent info
	intentName: text('intent_name').unique().notNull(),
	description: text('description'),

	// Training data
	examplePhrases: text('example_phrases').array(),
	requiredEntities: text('required_entities').array(),

	// Handler
	actionHandler: text('action_handler'),
	isActive: boolean('is_active').default(true),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// AI INSIGHTS
// ========================================

/**
 * AI-generated financial insights and recommendations
 */
export const aiInsights = pgTable('ai_insights', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Insight info
	insightType: text('insight_type').notNull(), // spending_pattern, budget_alert, opportunity, warning
	title: text('title').notNull(),
	description: text('description').notNull(),
	recommendation: text('recommendation'),

	// Impact
	impactLevel: text('impact_level').default('medium'), // low, medium, high

	// Related category
	categoryId: text('category_id').references(() => transactionCategories.id),

	// Supporting data
	data: jsonb('data'),

	// Status
	isRead: boolean('is_read').default(false),
	isActioned: boolean('is_actioned').default(false),

	// Validity
	expiresAt: timestamp('expires_at', { withTimezone: true }),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// SPENDING PATTERNS
// ========================================

/**
 * Analytical spending patterns by category and period
 */
export const spendingPatterns = pgTable('spending_patterns', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	categoryId: text('category_id').references(() => transactionCategories.id),

	// Period
	periodStart: date('period_start').notNull(),
	periodEnd: date('period_end').notNull(),
	periodType: text('period_type').notNull(), // daily, weekly, monthly, yearly

	// Metrics
	totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
	transactionCount: integer('transaction_count').notNull(),
	averageTransaction: decimal('average_transaction', {
		precision: 15,
		scale: 2,
	}),
	trendPercentage: decimal('trend_percentage', { precision: 5, scale: 2 }),

	// Additional data
	patternData: jsonb('pattern_data'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// BUDGET CATEGORIES
// ========================================

/**
 * Budget limits and alerts by category
 */
export const budgetCategories = pgTable('budget_categories', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
	categoryId: text('category_id').references(() => transactionCategories.id, {
		onDelete: 'cascade',
	}),

	// Budget
	budgetAmount: decimal('budget_amount', { precision: 15, scale: 2 }).notNull(),
	periodType: text('period_type').notNull(), // monthly, yearly

	// Alerts
	alertThreshold: decimal('alert_threshold', {
		precision: 5,
		scale: 2,
	}).default('80'),
	isActive: boolean('is_active').default(true),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// CHAT SESSIONS & MESSAGES
// ========================================

/**
 * Chat sessions for AI assistant conversations
 */
export const chatSessions = pgTable('chat_sessions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Session info
	title: text('title'),
	isActive: boolean('is_active').default(true),

	// Metadata
	metadata: jsonb('metadata'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/**
 * Chat messages within sessions
 */
export const chatMessages = pgTable('chat_messages', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	sessionId: text('session_id').references(() => chatSessions.id, {
		onDelete: 'cascade',
	}),

	// Message content
	role: text('role').notNull(), // user, assistant, system
	content: text('content').notNull(),

	// Optional attachments/context
	attachments: jsonb('attachments'),
	context: jsonb('context'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

/**
 * Voice transcriptions for speech-to-text processing
 */
export const voiceTranscriptions = pgTable('voice_transcriptions', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),

	// Transcription data
	audioStoragePath: text('audio_storage_path').notNull(),
	transcript: text('transcript').notNull(),
	confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
	language: text('language').notNull(),
	processingTimeMs: integer('processing_time_ms').notNull(),

	// Expiration
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

/**
 * Snapshots of financial context for chat history
 */
export const chatContextSnapshots = pgTable('chat_context_snapshots', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	conversationId: text('conversation_id').references(() => chatSessions.id, {
		onDelete: 'cascade',
	}),

	// Context data
	recentTransactions: jsonb('recent_transactions'),
	accountBalances: jsonb('account_balances'),
	upcomingEvents: jsonb('upcoming_events'),
	userPreferences: jsonb('user_preferences'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ========================================
// TYPE EXPORTS
// ========================================

export type VoiceCommand = typeof voiceCommands.$inferSelect;
export type InsertVoiceCommand = typeof voiceCommands.$inferInsert;

export type CommandIntent = typeof commandIntents.$inferSelect;
export type InsertCommandIntent = typeof commandIntents.$inferInsert;

export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = typeof aiInsights.$inferInsert;

export type SpendingPattern = typeof spendingPatterns.$inferSelect;
export type InsertSpendingPattern = typeof spendingPatterns.$inferInsert;

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type InsertBudgetCategory = typeof budgetCategories.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export type VoiceTranscription = typeof voiceTranscriptions.$inferSelect;
export type InsertVoiceTranscription = typeof voiceTranscriptions.$inferInsert;

export type ChatContextSnapshot = typeof chatContextSnapshots.$inferSelect;
export type InsertChatContextSnapshot = typeof chatContextSnapshots.$inferInsert;
