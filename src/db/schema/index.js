/**
 * @fileoverview Central schema index - Re-exports all domain schema files
 * @module db/schema
 *
 * This file provides a central export point for all Drizzle ORM schema definitions.
 * Schema is organized by domain for maintainability:
 * - users: User profiles, preferences, consent
 * - auth: Authentication, sessions, security
 * - transactions: Financial events, categories, budgets
 * - banking: Bank connections, accounts, Open Banking
 * - payments: PIX, boletos, scheduled payments
 * - voice: Voice assistant, biometrics
 * - ai: AI insights, chat, NLU
 * - lgpd: LGPD compliance, audit logs
 * - calendar: Google Calendar sync
 * - contacts: User contacts and payment methods
 */
// AI and chat
export {
  aiInsights,
  chatContextSnapshots,
  chatConversations,
  chatMessages,
  conversationContexts,
  nluLearningData,
} from './ai';
// Authentication and security
export {
  authAttempts,
  authSessions,
  biometricCredentials,
  fraudDetectionRules,
  otpCodes,
  pushAuthRequests,
  securityAlerts,
  securityEvents,
} from './auth';
// Banking and Open Banking
export { bankAccounts, bankAuditLogs, bankConnections, bankConsent, bankTokens } from './banking';
// Calendar sync
export {
  calendarSyncAudit,
  calendarSyncMapping,
  calendarSyncSettings,
  googleCalendarTokens,
} from './calendar';
// Contacts
export { contactPaymentMethods, contacts } from './contacts';
// LGPD compliance
export { auditLogs, dataSubjectRequests, legalHolds } from './lgpd';
// Payments (PIX, boletos, scheduled)
export { boletos, paymentRules, pixKeys, pixTransfers, scheduledPayments } from './payments';
// Financial transactions
export {
  budgetCategories,
  eventReminders,
  eventTypes,
  financialAccounts,
  financialCategories,
  financialEvents,
  financialSnapshots,
  spendingPatterns,
  transactions,
} from './transactions';
// User domain
export {
  authUsers,
  userActivity,
  userConsent,
  userPins,
  userPreferences,
  userSecurityPreferences,
  users,
} from './users';
// Voice assistant and biometrics
export {
  biometricPatterns,
  voiceAuditLogs,
  voiceConsent,
  voiceFeedback,
  voiceRecordings,
  voiceTranscriptions,
} from './voice';
