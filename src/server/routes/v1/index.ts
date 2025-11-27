/**
 * v1 API Routes Index
 * Imports and exports all v1 route modules
 */

import { aiChat as aiChatRouter } from './ai-chat';
import bankAccountsRouter from './bank-accounts';
import bankingRouter from './banking';
import calendarRouter from './calendar';
import complianceRouter from './compliance';
import contactsRouter from './contacts';
import googleCalendarRouter from './google-calendar';
import healthRouter from './health';
// PIX functionality removed
import transactionsRouter from './transactions';
import usersRouter from './users';
import voiceRouter from './voice';

// Export all routers for use in main server
export {
  healthRouter,
  voiceRouter,
  bankingRouter,
  // pixRouter removed - PIX functionality discontinued
  contactsRouter,
  bankAccountsRouter,
  usersRouter,
  transactionsRouter,
  calendarRouter,
  googleCalendarRouter,
  complianceRouter,
  aiChatRouter,
};
