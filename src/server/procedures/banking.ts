import { protectedProcedure, router } from '@/server/trpc-helpers';

/**
 * Banking Router - Placeholder for Belvo Integration
 *
 * This router will eventually support:
 * - Linking bank accounts via Belvo/Open Banking
 * - Synchronizing balances and transactions automatically
 * - Handling multi-bank aggregation and reconciliation
 * - Surfacing synchronization history and audit logs
 *
 * Current Status:
 * - Not implemented. Manual account workflows live in `bankAccounts` router.
 * - See docs/architecture/tech-stack.md for Belvo roadmap details.
 *
 * @see https://docs.belvo.com/ for Belvo API documentation
 */
export const createBankingRouter = (_t?: unknown) =>
  router({
    /**
     * Placeholder accounts fetch until Belvo integration is prioritized.
     *
     * @returns Empty list representing the absence of live banking data.
     */
    getAccounts: protectedProcedure.query(async () => {
      return [];
    }),
  });
