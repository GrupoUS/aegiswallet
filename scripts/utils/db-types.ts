/**
 * Database Type Utilities for Scripts
 *
 * Helper types and utilities for working with Neon/Drizzle query results
 * in script files.
 */

import type { NeonHttpQueryResult } from 'drizzle-orm/neon-http';

/**
 * Extract rows from a NeonHttpQueryResult
 * Use this when you need to access the rows array from a db.execute() result
 *
 * @example
 * const result = await db.execute(sql`SELECT * FROM users`);
 * const rows = getRows(result);
 * console.log(`Found ${rows.length} users`);
 */
export function getRows<T extends Record<string, unknown>>(result: NeonHttpQueryResult<T>): T[] {
	return result.rows ?? [];
}

/**
 * Get the first row from a NeonHttpQueryResult
 * Returns undefined if no rows exist
 *
 * @example
 * const result = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
 * const user = getFirstRow(result);
 */
export function getFirstRow<T extends Record<string, unknown>>(
	result: NeonHttpQueryResult<T>,
): T | undefined {
	return result.rows?.[0];
}

/**
 * Get row count from a NeonHttpQueryResult
 *
 * @example
 * const result = await db.execute(sql`SELECT * FROM users`);
 * console.log(`Found ${getRowCount(result)} users`);
 */
export function getRowCount<T extends Record<string, unknown>>(
	result: NeonHttpQueryResult<T>,
): number {
	return result.rows?.length ?? 0;
}
