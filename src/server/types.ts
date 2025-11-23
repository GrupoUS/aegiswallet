/**
 * tRPC Type Definitions
 * Proper TypeScript types for tRPC procedures and context
 */

import type { TRPCRouterRecord } from '@trpc/server';
import type { Context } from './context';

/**
 * Base tRPC router type
 */
export type BaseRouter = TRPCRouterRecord;

/**
 * tRPC procedure context type
 */
export type ProcedureContext = Context;

/**
 * tRPC mutation input type helper
 */
export type MutationInput<T> = T;

/**
 * tRPC query input type helper
 */
export type QueryInput<T> = T;

/**
 * tRPC procedure input type
 */
export interface ProcedureInput<T = unknown> {
  ctx: ProcedureContext;
  input: T;
}

/**
 * tRPC procedure type definitions
 */
export interface Procedure<TInput = unknown, TOutput = unknown> {
  query?: (opts: ProcedureInput<TInput>) => Promise<TOutput>;
  mutation?: (opts: ProcedureInput<TInput>) => Promise<TOutput>;
}

/**
 * Enhanced router builder type
 */
export type RouterBuilder = any; // Simplified type to avoid complex tRPC type inference
