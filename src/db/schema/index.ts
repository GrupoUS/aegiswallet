/**
 * Drizzle ORM Schema - Main Export
 *
 * Central export for all database schema definitions
 * Used by Drizzle client and migration tools
 */

// ========================================
// TABLES
// ========================================

// Audit & LGPD
export {
	type AuditLog,
	auditLogs,
	type DataExportRequest,
	dataExportRequests,
	type ErrorLog,
	errorLogs,
	type InsertAuditLog,
	type InsertDataExportRequest,
	type InsertErrorLog,
	type InsertLgpdConsentLog,
	type InsertUserSession,
	type LgpdConsentLog,
	lgpdConsentLogs,
	type UserSession,
	userSessions,
} from './audit';
// Bank Accounts
export {
	type AccountBalanceHistory,
	accountBalanceHistory,
	type BankAccount,
	type BankSyncLog,
	bankAccounts,
	bankSyncLogs,
	type InsertAccountBalanceHistory,
	type InsertBankAccount,
	type InsertBankSyncLog,
} from './bank-accounts';
// Billing & Subscriptions
export {
	type InsertPaymentHistory,
	type InsertSubscription,
	type InsertSubscriptionPlan,
	type PaymentHistory,
	paymentHistory,
	paymentStatusEnum,
	type Subscription,
	type SubscriptionPlan,
	subscriptionPlans,
	subscriptionStatusEnum,
	subscriptions,
} from './billing';
// Boletos
export {
	type Boleto,
	type BoletoPayment,
	boletoPayments,
	boletoStatusEnum,
	boletos,
	type InsertBoleto,
	type InsertBoletoPayment,
} from './boletos';
// Calendar
export {
	type EventReminder,
	type EventType,
	eventReminders,
	eventTypes,
	type FinancialEvent,
	financialEvents,
	type InsertEventReminder,
	type InsertEventType,
	type InsertFinancialEvent,
} from './calendar';
// Contacts
export {
	type BankAccountPaymentMethodDetails,
	type BoletoPaymentMethodDetails,
	type Contact,
	type ContactPaymentMethod,
	contactPaymentMethods,
	contacts,
	type InsertContact,
	type InsertContactPaymentMethod,
	type PixPaymentMethodDetails,
	paymentMethodTypeEnum,
} from './contacts';
// LGPD Compliance
export {
	// Tables
	type ComplianceAuditLog,
	type ConsentTemplate,
	// Enums
	collectionMethodEnum,
	complianceAuditLogs,
	complianceEventTypeEnum,
	consentTemplates,
	consentTypeEnum,
	type DataDeletionRequest,
	type DataRetentionPolicy,
	dataDeletionRequests,
	dataRetentionPolicies,
	deletionRequestStatusEnum,
	deletionRequestTypeEnum,
	exportFormatEnum,
	exportRequestTypeEnum,
	exportStatusEnum,
	type InsertComplianceAuditLog,
	type InsertConsentTemplate,
	type InsertDataDeletionRequest,
	type InsertDataRetentionPolicy,
	type InsertLegalHold,
	type InsertLgpdConsent,
	type InsertLgpdExportRequest,
	type InsertTransactionLimit,
	type LegalHold,
	type LgpdConsent,
	type LgpdExportRequest,
	legalHolds,
	lgpdConsents,
	lgpdExportRequests,
	limitTypeEnum,
	type TransactionLimit,
	transactionLimits,
} from './lgpd';
// Notifications
export {
	type AlertRule,
	type AlertRuleActions,
	type AlertRuleConditions,
	alertRules,
	type InsertAlertRule,
	type InsertNotification,
	type InsertNotificationLog,
	type Notification,
	type NotificationLog,
	notificationLogs,
	notifications,
} from './notifications';
// PIX
export {
	type InsertPixKey,
	type InsertPixQrCode,
	type InsertPixTransaction,
	type PixKey,
	type PixQrCode,
	type PixTransaction,
	pixKeys,
	pixKeyTypeEnum,
	pixQrCodes,
	pixTransactionStatusEnum,
	pixTransactions,
	pixTransactionTypeEnum,
} from './pix';
// Transactions
export {
	type InsertTransaction,
	type InsertTransactionCategory,
	type InsertTransactionSchedule,
	type Transaction,
	type TransactionCategory,
	type TransactionSchedule,
	transactionCategories,
	transactionSchedules,
	transactions,
} from './transactions';
// Users & Auth
export {
	type InsertUser,
	type InsertUserPreferences,
	type InsertUserSecurity,
	type User,
	type UserPreferences,
	type UserSecurity,
	userPreferences,
	userSecurity,
	users,
} from './users';
// Voice & AI
export {
	type AiInsight,
	aiInsights,
	type BudgetCategory,
	budgetCategories,
	type ChatMessage,
	type ChatSession,
	type CommandIntent,
	chatMessages,
	chatSessions,
	commandIntents,
	type InsertAiInsight,
	type InsertBudgetCategory,
	type InsertChatMessage,
	type InsertChatSession,
	type InsertCommandIntent,
	type InsertSpendingPattern,
	type InsertVoiceCommand,
	type SpendingPattern,
	spendingPatterns,
	type VoiceCommand,
	voiceCommands,
} from './voice-ai';

// ========================================
// RELATIONS
// ========================================

export {
	accountBalanceHistoryRelations,
	aiInsightsRelations,
	alertRulesRelations,
	auditLogsRelations,
	bankAccountsRelations,
	bankSyncLogsRelations,
	boletoPaymentsRelations,
	boletosRelations,
	budgetCategoriesRelations,
	chatMessagesRelations,
	chatSessionsRelations,
	complianceAuditLogsRelations,
	consentTemplatesRelations,
	contactPaymentMethodsRelations,
	contactsRelations,
	dataDeletionRequestsRelations,
	dataExportRequestsRelations,
	dataRetentionPoliciesRelations,
	errorLogsRelations,
	eventRemindersRelations,
	eventTypesRelations,
	financialEventsRelations,
	legalHoldsRelations,
	lgpdConsentLogsRelations,
	lgpdConsentsRelations,
	lgpdExportRequestsRelations,
	notificationLogsRelations,
	notificationsRelations,
	paymentHistoryRelations,
	pixKeysRelations,
	pixQrCodesRelations,
	pixTransactionsRelations,
	spendingPatternsRelations,
	subscriptionPlansRelations,
	subscriptionsRelations,
	transactionCategoriesRelations,
	transactionLimitsRelations,
	transactionSchedulesRelations,
	transactionsRelations,
	userPreferencesRelations,
	userSecurityRelations,
	userSessionsRelations,
	usersRelations,
	voiceCommandsRelations,
} from './relations';
