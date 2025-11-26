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

// User domain
export {
  authUsers,
  users,
  userPreferences,
  userActivity,
  userConsent,
  userPins,
  userSecurityPreferences,
  type User,
  type NewUser,
  type UserPreferences,
  type UserConsent,
} from './users'

// Authentication and security
export {
  authAttempts,
  authSessions,
  biometricCredentials,
  otpCodes,
  pushAuthRequests,
  securityEvents,
  securityAlerts,
  fraudDetectionRules,
  type AuthAttempt,
  type AuthSession,
  type SecurityEvent,
  type SecurityAlert,
} from './auth'


// Financial transactions
export {
  financialCategories,
  eventTypes,
  financialEvents,
  eventReminders,
  transactions,
  financialAccounts,
  budgetCategories,
  spendingPatterns,
  financialSnapshots,
  type FinancialCategory,
  type FinancialEvent,
  type Transaction,
  type NewTransaction,
  type BudgetCategory,
  type SpendingPattern,
} from './transactions'

// Banking and Open Banking
export {
  bankConnections,
  bankAccounts,
  bankTokens,
  bankConsent,
  bankAuditLogs,
  type BankConnection,
  type BankAccount,
  type BankToken,
  type BankConsent,
} from './banking'

// Payments (PIX, boletos, scheduled)
export {
  pixKeys,
  paymentRules,
  scheduledPayments,
  pixTransfers,
  boletos,
  type PixKey,
  type PaymentRule,
  type ScheduledPayment,
  type PixTransfer,
  type Boleto,
} from './payments'

// Voice assistant and biometrics
export {
  voiceConsent,
  voiceFeedback,
  voiceRecordings,
  voiceTranscriptions,
  voiceAuditLogs,
  biometricPatterns,
  type VoiceConsent,
  type VoiceFeedback,
  type VoiceRecording,
  type VoiceTranscription,
  type BiometricPattern,
} from './voice'


// AI and chat
export {
  aiInsights,
  chatConversations,
  chatMessages,
  chatContextSnapshots,
  conversationContexts,
  nluLearningData,
  type AiInsight,
  type ChatConversation,
  type ChatMessage,
  type ConversationContext,
  type NluLearningData,
} from './ai'

// LGPD compliance
export {
  auditLogs,
  dataSubjectRequests,
  legalHolds,
  type AuditLog,
  type DataSubjectRequest,
  type LegalHold,
} from './lgpd'

// Calendar sync
export {
  googleCalendarTokens,
  calendarSyncSettings,
  calendarSyncMapping,
  calendarSyncAudit,
  type GoogleCalendarToken,
  type CalendarSyncSetting,
  type CalendarSyncMapping,
  type CalendarSyncAudit,
} from './calendar'

// Contacts
export {
  contacts,
  contactPaymentMethods,
  type Contact,
  type NewContact,
  type ContactPaymentMethod,
} from './contacts'
