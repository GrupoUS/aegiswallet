/**
 * v1 API Routes Index
 * Imports and exports all v1 route modules
 */

import healthRouter from './health';
import voiceRouter from './voice';
import bankingRouter from './banking';
import pixRouter from './pix';
import contactsRouter from './contacts';
// Import other v1 routers as they are created
// import bankAccountsRouter from './bank-accounts';
// import calendarRouter from './calendar';
// import googleCalendarRouter from './google-calendar';
// import usersRouter from './users';
// import transactionsRouter from './transactions';

// Export all routers for use in main server
export {
  healthRouter,
  voiceRouter,
  bankingRouter,
  pixRouter,
  contactsRouter,
  // bankAccountsRouter,
  // calendarRouter,
  // googleCalendarRouter,
  // usersRouter,
  // transactionsRouter,
};
