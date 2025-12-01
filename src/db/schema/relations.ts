/**
 * Drizzle ORM Relations - All Table Relationships
 *
 * Defines relationships between all tables for Drizzle's relational query API
 */

import { relations } from 'drizzle-orm';

import { auditLogs, dataExportRequests, errorLogs, lgpdConsentLogs, userSessions } from './audit';
import { accountBalanceHistory, bankAccounts, bankSyncLogs } from './bank-accounts';
import { paymentHistory, subscriptionPlans, subscriptions } from './billing';
import { boletoPayments, boletos } from './boletos';
import { eventReminders, eventTypes, financialEvents } from './calendar';
import { contactPaymentMethods, contacts } from './contacts';
import {
	complianceAuditLogs,
	consentTemplates,
	dataDeletionRequests,
	dataRetentionPolicies,
	legalHolds,
	lgpdConsents,
	lgpdExportRequests,
	transactionLimits,
} from './lgpd';
import { alertRules, notificationLogs, notifications } from './notifications';
import { pixKeys, pixQrCodes, pixTransactions } from './pix';
import { transactionCategories, transactionSchedules, transactions } from './transactions';
// Import all tables
import { userPreferences, userSecurity, users } from './users';
import {
	aiInsights,
	budgetCategories,
	chatMessages,
	chatSessions,
	spendingPatterns,
	voiceCommands,
	voiceTranscriptions,
} from './voice-ai';

// ========================================
// USER RELATIONS
// ========================================

export const usersRelations = relations(users, ({ one, many }) => ({
	// One-to-one
	preferences: one(userPreferences, {
		fields: [users.id],
		references: [userPreferences.userId],
	}),
	security: one(userSecurity, {
		fields: [users.id],
		references: [userSecurity.userId],
	}),

	// One-to-many
	bankAccounts: many(bankAccounts),
	transactionCategories: many(transactionCategories),
	transactions: many(transactions),
	transactionSchedules: many(transactionSchedules),
	financialEvents: many(financialEvents),
	eventReminders: many(eventReminders),
	pixKeys: many(pixKeys),
	pixQrCodes: many(pixQrCodes),
	pixTransactions: many(pixTransactions),
	contacts: many(contacts),
	boletos: many(boletos),
	voiceCommands: many(voiceCommands),
	voiceTranscriptions: many(voiceTranscriptions),
	aiInsights: many(aiInsights),
	spendingPatterns: many(spendingPatterns),
	budgetCategories: many(budgetCategories),
	chatSessions: many(chatSessions),
	notifications: many(notifications),
	alertRules: many(alertRules),
	auditLogs: many(auditLogs),
	errorLogs: many(errorLogs),
	userSessions: many(userSessions),
	lgpdConsentLogs: many(lgpdConsentLogs),
	dataExportRequests: many(dataExportRequests),
	bankSyncLogs: many(bankSyncLogs),
	// LGPD Compliance tables
	lgpdConsents: many(lgpdConsents),
	dataDeletionRequests: many(dataDeletionRequests),
	lgpdExportRequests: many(lgpdExportRequests),
	transactionLimits: many(transactionLimits),
	complianceAuditLogs: many(complianceAuditLogs),
	legalHolds: many(legalHolds),
	// Billing & Subscriptions
	subscriptions: many(subscriptions),
	paymentHistory: many(paymentHistory),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id],
	}),
}));

export const userSecurityRelations = relations(userSecurity, ({ one }) => ({
	user: one(users, {
		fields: [userSecurity.userId],
		references: [users.id],
	}),
}));

// ========================================
// BANK ACCOUNT RELATIONS
// ========================================

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
	user: one(users, {
		fields: [bankAccounts.userId],
		references: [users.id],
	}),
	balanceHistory: many(accountBalanceHistory),
	syncLogs: many(bankSyncLogs),
	transactions: many(transactions),
	transactionSchedules: many(transactionSchedules),
	financialEvents: many(financialEvents),
}));

export const accountBalanceHistoryRelations = relations(accountBalanceHistory, ({ one }) => ({
	account: one(bankAccounts, {
		fields: [accountBalanceHistory.accountId],
		references: [bankAccounts.id],
	}),
}));

export const bankSyncLogsRelations = relations(bankSyncLogs, ({ one }) => ({
	user: one(users, {
		fields: [bankSyncLogs.userId],
		references: [users.id],
	}),
	account: one(bankAccounts, {
		fields: [bankSyncLogs.accountId],
		references: [bankAccounts.id],
	}),
}));

// ========================================
// TRANSACTION RELATIONS
// ========================================

export const transactionCategoriesRelations = relations(transactionCategories, ({ one, many }) => ({
	user: one(users, {
		fields: [transactionCategories.userId],
		references: [users.id],
	}),
	parent: one(transactionCategories, {
		fields: [transactionCategories.parentId],
		references: [transactionCategories.id],
		relationName: 'categoryParent',
	}),
	children: many(transactionCategories, {
		relationName: 'categoryParent',
	}),
	transactions: many(transactions),
	transactionSchedules: many(transactionSchedules),
	financialEvents: many(financialEvents),
	aiInsights: many(aiInsights),
	spendingPatterns: many(spendingPatterns),
	budgetCategories: many(budgetCategories),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id],
	}),
	account: one(bankAccounts, {
		fields: [transactions.accountId],
		references: [bankAccounts.id],
	}),
	category: one(transactionCategories, {
		fields: [transactions.categoryId],
		references: [transactionCategories.id],
	}),
	pixTransactions: many(pixTransactions),
	boletoPayments: many(boletoPayments),
	financialEvents: many(financialEvents),
}));

export const transactionSchedulesRelations = relations(transactionSchedules, ({ one }) => ({
	user: one(users, {
		fields: [transactionSchedules.userId],
		references: [users.id],
	}),
	account: one(bankAccounts, {
		fields: [transactionSchedules.accountId],
		references: [bankAccounts.id],
	}),
	category: one(transactionCategories, {
		fields: [transactionSchedules.categoryId],
		references: [transactionCategories.id],
	}),
	executedTransaction: one(transactions, {
		fields: [transactionSchedules.executedTransactionId],
		references: [transactions.id],
	}),
}));

// ========================================
// CALENDAR RELATIONS
// ========================================

export const eventTypesRelations = relations(eventTypes, ({ many }) => ({
	financialEvents: many(financialEvents),
}));

export const financialEventsRelations = relations(financialEvents, ({ one, many }) => ({
	user: one(users, {
		fields: [financialEvents.userId],
		references: [users.id],
	}),
	account: one(bankAccounts, {
		fields: [financialEvents.accountId],
		references: [bankAccounts.id],
	}),
	category: one(transactionCategories, {
		fields: [financialEvents.categoryId],
		references: [transactionCategories.id],
	}),
	eventType: one(eventTypes, {
		fields: [financialEvents.eventTypeId],
		references: [eventTypes.id],
	}),
	parentEvent: one(financialEvents, {
		fields: [financialEvents.parentEventId],
		references: [financialEvents.id],
		relationName: 'eventParent',
	}),
	childEvents: many(financialEvents, {
		relationName: 'eventParent',
	}),
	transaction: one(transactions, {
		fields: [financialEvents.transactionId],
		references: [transactions.id],
	}),
	reminders: many(eventReminders),
}));

export const eventRemindersRelations = relations(eventReminders, ({ one }) => ({
	user: one(users, {
		fields: [eventReminders.userId],
		references: [users.id],
	}),
	event: one(financialEvents, {
		fields: [eventReminders.eventId],
		references: [financialEvents.id],
	}),
}));

// ========================================
// PIX RELATIONS
// ========================================

export const pixKeysRelations = relations(pixKeys, ({ one }) => ({
	user: one(users, {
		fields: [pixKeys.userId],
		references: [users.id],
	}),
}));

export const pixQrCodesRelations = relations(pixQrCodes, ({ one, many }) => ({
	user: one(users, {
		fields: [pixQrCodes.userId],
		references: [users.id],
	}),
	pixTransactions: many(pixTransactions),
}));

export const pixTransactionsRelations = relations(pixTransactions, ({ one }) => ({
	user: one(users, {
		fields: [pixTransactions.userId],
		references: [users.id],
	}),
	transaction: one(transactions, {
		fields: [pixTransactions.transactionId],
		references: [transactions.id],
	}),
	qrCode: one(pixQrCodes, {
		fields: [pixTransactions.qrCodeId],
		references: [pixQrCodes.id],
	}),
}));

// ========================================
// CONTACTS RELATIONS
// ========================================

export const contactsRelations = relations(contacts, ({ one, many }) => ({
	user: one(users, {
		fields: [contacts.userId],
		references: [users.id],
	}),
	paymentMethods: many(contactPaymentMethods),
}));

export const contactPaymentMethodsRelations = relations(contactPaymentMethods, ({ one }) => ({
	contact: one(contacts, {
		fields: [contactPaymentMethods.contactId],
		references: [contacts.id],
	}),
}));

// ========================================
// BOLETOS RELATIONS
// ========================================

export const boletosRelations = relations(boletos, ({ one, many }) => ({
	user: one(users, {
		fields: [boletos.userId],
		references: [users.id],
	}),
	transaction: one(transactions, {
		fields: [boletos.transactionId],
		references: [transactions.id],
	}),
	payments: many(boletoPayments),
}));

export const boletoPaymentsRelations = relations(boletoPayments, ({ one }) => ({
	boleto: one(boletos, {
		fields: [boletoPayments.boletoId],
		references: [boletos.id],
	}),
	transaction: one(transactions, {
		fields: [boletoPayments.transactionId],
		references: [transactions.id],
	}),
}));

// ========================================
// VOICE & AI RELATIONS
// ========================================

export const voiceCommandsRelations = relations(voiceCommands, ({ one }) => ({
	user: one(users, {
		fields: [voiceCommands.userId],
		references: [users.id],
	}),
}));

export const voiceTranscriptionsRelations = relations(voiceTranscriptions, ({ one }) => ({
	user: one(users, {
		fields: [voiceTranscriptions.userId],
		references: [users.id],
	}),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
	user: one(users, {
		fields: [aiInsights.userId],
		references: [users.id],
	}),
	category: one(transactionCategories, {
		fields: [aiInsights.categoryId],
		references: [transactionCategories.id],
	}),
}));

export const spendingPatternsRelations = relations(spendingPatterns, ({ one }) => ({
	user: one(users, {
		fields: [spendingPatterns.userId],
		references: [users.id],
	}),
	category: one(transactionCategories, {
		fields: [spendingPatterns.categoryId],
		references: [transactionCategories.id],
	}),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
	user: one(users, {
		fields: [budgetCategories.userId],
		references: [users.id],
	}),
	category: one(transactionCategories, {
		fields: [budgetCategories.categoryId],
		references: [transactionCategories.id],
	}),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
	user: one(users, {
		fields: [chatSessions.userId],
		references: [users.id],
	}),
	messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	session: one(chatSessions, {
		fields: [chatMessages.sessionId],
		references: [chatSessions.id],
	}),
}));

// ========================================
// NOTIFICATIONS RELATIONS
// ========================================

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
	logs: many(notificationLogs),
}));

export const alertRulesRelations = relations(alertRules, ({ one }) => ({
	user: one(users, {
		fields: [alertRules.userId],
		references: [users.id],
	}),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
	notification: one(notifications, {
		fields: [notificationLogs.notificationId],
		references: [notifications.id],
	}),
}));

// ========================================
// AUDIT RELATIONS
// ========================================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id],
	}),
}));

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
	user: one(users, {
		fields: [errorLogs.userId],
		references: [users.id],
	}),
	resolvedByUser: one(users, {
		fields: [errorLogs.resolvedBy],
		references: [users.id],
		relationName: 'resolvedByUser',
	}),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id],
	}),
}));

export const lgpdConsentLogsRelations = relations(lgpdConsentLogs, ({ one }) => ({
	user: one(users, {
		fields: [lgpdConsentLogs.userId],
		references: [users.id],
	}),
}));

export const dataExportRequestsRelations = relations(dataExportRequests, ({ one }) => ({
	user: one(users, {
		fields: [dataExportRequests.userId],
		references: [users.id],
	}),
}));

// ========================================
// LGPD COMPLIANCE RELATIONS
// ========================================

export const consentTemplatesRelations = relations(consentTemplates, ({ many }) => ({
	consents: many(lgpdConsents),
}));

export const lgpdConsentsRelations = relations(lgpdConsents, ({ one }) => ({
	user: one(users, {
		fields: [lgpdConsents.userId],
		references: [users.id],
	}),
}));

export const dataRetentionPoliciesRelations = relations(dataRetentionPolicies, () => ({}));

export const dataDeletionRequestsRelations = relations(dataDeletionRequests, ({ one }) => ({
	user: one(users, {
		fields: [dataDeletionRequests.userId],
		references: [users.id],
	}),
}));

export const lgpdExportRequestsRelations = relations(lgpdExportRequests, ({ one }) => ({
	user: one(users, {
		fields: [lgpdExportRequests.userId],
		references: [users.id],
	}),
}));

export const transactionLimitsRelations = relations(transactionLimits, ({ one }) => ({
	user: one(users, {
		fields: [transactionLimits.userId],
		references: [users.id],
	}),
}));

export const complianceAuditLogsRelations = relations(complianceAuditLogs, ({ one }) => ({
	user: one(users, {
		fields: [complianceAuditLogs.userId],
		references: [users.id],
	}),
}));

export const legalHoldsRelations = relations(legalHolds, ({ one }) => ({
	user: one(users, {
		fields: [legalHolds.userId],
		references: [users.id],
	}),
}));

// ========================================
// BILLING & SUBSCRIPTION RELATIONS
// ========================================

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
	subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id],
	}),
	plan: one(subscriptionPlans, {
		fields: [subscriptions.planId],
		references: [subscriptionPlans.id],
	}),
	paymentHistory: many(paymentHistory),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
	user: one(users, {
		fields: [paymentHistory.userId],
		references: [users.id],
	}),
	subscription: one(subscriptions, {
		fields: [paymentHistory.subscriptionId],
		references: [subscriptions.id],
	}),
}));
