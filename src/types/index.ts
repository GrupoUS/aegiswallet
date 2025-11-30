/**
 * AegisWallet Type Definitions Index
 *
 * Central export point for all type definitions used throughout the application.
 * Ensures type safety and LGPD compliance across all modules.
 *
 * @version 2.0.0 - Updated for NeonDB + Drizzle ORM
 * @since 2025-11-19
 */

// Database types (from Drizzle schema) - exclude UserSession to avoid conflict
export type {
	// AI/Voice
	AiInsight,
	// Bank Accounts
	BankAccount,
	// Contacts
	Contact,
	ContactPaymentMethod,
	EventReminder,
	EventType,
	// Calendar
	FinancialEvent as DrizzleFinancialEvent,
	InsertAiInsight,
	InsertBankAccount,
	InsertContact,
	InsertContactPaymentMethod,
	InsertEventReminder,
	InsertEventType,
	InsertFinancialEvent,
	InsertNotification,
	InsertPixKey,
	InsertPixTransaction,
	InsertTransaction,
	InsertTransactionCategory,
	InsertTransactionSchedule,
	InsertUser,
	InsertUserPreferences,
	InsertUserSecurity,
	InsertVoiceCommand,
	// Notifications
	Notification,
	// PIX
	PixKey,
	PixTransaction,
	// Transactions
	Transaction,
	TransactionCategory,
	TransactionSchedule,
	// Users & Auth
	User,
	UserPreferences,
	UserSecurity,
	VoiceCommand as DrizzleVoiceCommand,
} from '../db/schema';
export * from './database-stubs';
export * from './financial/chart.types';
export type { FinancialEvent } from './financial-events';
// Financial types
export * from './financial-events';
export * from './nlu.types';
// PIX types removed - functionality discontinued
// Security types
export * from './security.types';
export type { VoiceCommand } from './voice';
// Voice and NLU types
export * from './voice';
