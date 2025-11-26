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
export {
  type AiInsight,
  aiInsights,
  type ChatConversation,
  type ChatMessage,
  type ConversationContext,
  chatContextSnapshots,
  chatConversations,
  chatMessages,
  conversationContexts,
  type NluLearningData,
  nluLearningData,
} from './ai';
export {
  type AuthAttempt,
  type AuthSession,
  authAttempts,
  authSessions,
  biometricCredentials,
  fraudDetectionRules,
  otpCodes,
  pushAuthRequests,
  type SecurityAlert,
  type SecurityEvent,
  securityAlerts,
  securityEvents,
} from './auth';
export {
  type BankAccount,
  type BankConnection,
  type BankConsent,
  type BankToken,
  bankAccounts,
  bankAuditLogs,
  bankConnections,
  bankConsent,
  bankTokens,
} from './banking';
export {
  type CalendarSyncAudit,
  type CalendarSyncMapping,
  type CalendarSyncSetting,
  calendarSyncAudit,
  calendarSyncMapping,
  calendarSyncSettings,
  type GoogleCalendarToken,
  googleCalendarTokens,
} from './calendar';
export {
  type Contact,
  type ContactPaymentMethod,
  contactPaymentMethods,
  contacts,
  type NewContact,
} from './contacts';
export {
  type AuditLog,
  auditLogs,
  type DataSubjectRequest,
  dataSubjectRequests,
  type LegalHold,
  legalHolds,
} from './lgpd';
export {
  type Boleto,
  boletos,
  type PaymentRule,
  type PixKey,
  type PixTransfer,
  paymentRules,
  pixKeys,
  pixTransfers,
  type ScheduledPayment,
  scheduledPayments,
} from './payments';
export {
  type BudgetCategory,
  budgetCategories,
  eventReminders,
  eventTypes,
  type FinancialCategory,
  type FinancialEvent,
  financialAccounts,
  financialCategories,
  financialEvents,
  financialSnapshots,
  type NewTransaction,
  type SpendingPattern,
  spendingPatterns,
  type Transaction,
  transactions,
} from './transactions';
export {
  authUsers,
  type NewUser,
  type User,
  type UserConsent,
  type UserPreferences,
  userActivity,
  userConsent,
  userPins,
  userPreferences,
  userSecurityPreferences,
  users,
} from './users';
export {
  type BiometricPattern,
  biometricPatterns,
  type VoiceConsent,
  type VoiceFeedback,
  type VoiceRecording,
  type VoiceTranscription,
  voiceAuditLogs,
  voiceConsent,
  voiceFeedback,
  voiceRecordings,
  voiceTranscriptions,
} from './voice';
