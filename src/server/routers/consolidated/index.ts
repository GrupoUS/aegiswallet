/**
 * Consolidated Routers Index
 * Unified router structure replacing duplicate procedures/routers
 */

import { authRouter } from './auth';
import { transactionsRouter } from './transactions';
import { usersRouter } from './users';

export const consolidatedRouters = {
  auth: authRouter,
  transactions: transactionsRouter,
  users: usersRouter,
};

export default consolidatedRouters;
