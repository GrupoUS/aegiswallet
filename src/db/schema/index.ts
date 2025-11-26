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

// Authentication and security
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
// Banking and Open Banking
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
// Calendar sync
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
// Contacts
export {
  type Contact,
  type ContactPaymentMethod,
  contactPaymentMethods,
  contacts,
  type NewContact,
} from './contacts';
// LGPD compliance
export {
  type AuditLog,
  auditLogs,
  type DataSubjectRequest,
  dataSubjectRequests,
  type LegalHold,
  legalHolds,
} from './lgpd';
// Payments (PIX, boletos, scheduled)
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
// Financial transactions
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
// User domain
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
// Voice assistant and biometrics
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
