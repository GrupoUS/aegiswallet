/**
 * Consolidated Routers Index
 * Unified router structure replacing duplicate procedures/routers
 */

import { authRouter } from './auth';
import { transactionsRouter } from './transactions';
import { usersRouter } from './users';

export const consolidatedRouters = {
  auth: authRouter,
  users: usersRouter,
  transactions: transactionsRouter,
};

export default consolidatedRouters;
