/**
 * Financial Context Cache
 *
 * In-memory caching layer for AI financial context to reduce database queries.
 * Implements TTL-based expiration and automatic cleanup of stale entries.
 *
 * @module lib/ai/context/context-cache
 */

import { type FinancialContext, getAIFinancialContext } from './ai-context.service';
import type { DbClient } from '@/db/client';

// ========================================
// TYPES
// ========================================

interface CacheEntry {
	data: FinancialContext;
	timestamp: number;
	expiresAt: number;
}

interface CacheOptions {
	/** Time-to-live in milliseconds (default: 5 minutes) */
	ttlMs?: number;
	/** Cleanup interval in milliseconds (default: 1 minute) */
	cleanupIntervalMs?: number;
	/** Maximum number of cached entries (default: 1000) */
	maxEntries?: number;
}

// ========================================
// CACHE CONFIGURATION
// ========================================

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_ENTRIES = 1000;

// ========================================
// FINANCIAL CONTEXT CACHE CLASS
// ========================================

/**
 * In-memory cache for financial context data.
 * Thread-safe for single-process deployments.
 */
export class FinancialContextCache {
	private cache: Map<string, CacheEntry>;
	private cleanupTimer: ReturnType<typeof setInterval> | null = null;
	private readonly ttlMs: number;
	private readonly maxEntries: number;

	constructor(options: CacheOptions = {}) {
		this.cache = new Map();
		this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
		this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;

		// Start automatic cleanup
		const cleanupInterval = options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS;
		this.startCleanup(cleanupInterval);
	}

	/**
	 * Get cached context or return undefined if not found/expired
	 */
	get(userId: string): FinancialContext | undefined {
		const entry = this.cache.get(userId);

		if (!entry) {
			return undefined;
		}

		// Check if expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(userId);
			return undefined;
		}

		return entry.data;
	}

	/**
	 * Store context in cache with TTL
	 */
	set(userId: string, context: FinancialContext): void {
		// Enforce max entries limit using LRU-like eviction
		if (this.cache.size >= this.maxEntries) {
			this.evictOldest();
		}

		const now = Date.now();
		this.cache.set(userId, {
			data: context,
			timestamp: now,
			expiresAt: now + this.ttlMs,
		});
	}

	/**
	 * Invalidate cache entry for a specific user
	 */
	invalidate(userId: string): boolean {
		return this.cache.delete(userId);
	}

	/**
	 * Clear all cached entries
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache statistics
	 */
	stats(): { size: number; maxEntries: number; ttlMs: number } {
		return {
			size: this.cache.size,
			maxEntries: this.maxEntries,
			ttlMs: this.ttlMs,
		};
	}

	/**
	 * Check if user has valid cached context
	 */
	has(userId: string): boolean {
		const entry = this.cache.get(userId);
		if (!entry) return false;

		// Check expiration
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(userId);
			return false;
		}

		return true;
	}

	/**
	 * Get time remaining until expiration (ms), or -1 if not cached
	 */
	getTTLRemaining(userId: string): number {
		const entry = this.cache.get(userId);
		if (!entry) return -1;

		const remaining = entry.expiresAt - Date.now();
		return remaining > 0 ? remaining : -1;
	}

	/**
	 * Start automatic cleanup of expired entries
	 */
	private startCleanup(intervalMs: number): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
		}

		this.cleanupTimer = setInterval(() => {
			this.cleanupExpired();
		}, intervalMs);

		// Don't prevent process exit
		if (typeof this.cleanupTimer.unref === 'function') {
			this.cleanupTimer.unref();
		}
	}

	/**
	 * Remove all expired entries
	 */
	private cleanupExpired(): void {
		const now = Date.now();
		for (const [userId, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(userId);
			}
		}
	}

	/**
	 * Evict oldest entry when cache is full
	 */
	private evictOldest(): void {
		let oldestKey: string | null = null;
		let oldestTimestamp = Number.POSITIVE_INFINITY;

		for (const [key, entry] of this.cache.entries()) {
			if (entry.timestamp < oldestTimestamp) {
				oldestTimestamp = entry.timestamp;
				oldestKey = key;
			}
		}

		if (oldestKey) {
			this.cache.delete(oldestKey);
		}
	}

	/**
	 * Stop cleanup timer (for graceful shutdown)
	 */
	destroy(): void {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
		this.cache.clear();
	}
}

// ========================================
// SINGLETON INSTANCE
// ========================================

/** Global cache instance */
let globalCache: FinancialContextCache | null = null;

/**
 * Get or create the global cache instance
 */
function getGlobalCache(): FinancialContextCache {
	if (!globalCache) {
		globalCache = new FinancialContextCache({
			ttlMs: DEFAULT_TTL_MS,
			cleanupIntervalMs: DEFAULT_CLEANUP_INTERVAL_MS,
			maxEntries: DEFAULT_MAX_ENTRIES,
		});
	}
	return globalCache;
}

// ========================================
// PUBLIC API
// ========================================

/**
 * Get financial context with caching support.
 * Returns cached data if available and not expired, otherwise fetches fresh data.
 *
 * @param userId - User ID to fetch context for
 * @param db - Database client
 * @param userName - User's display name for personalization
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @returns Financial context data
 */
export async function getCachedFinancialContext(
	userId: string,
	db: DbClient,
	userName = 'Usuário',
	forceRefresh = false,
): Promise<FinancialContext> {
	const cache = getGlobalCache();

	// Check cache unless force refresh is requested
	if (!forceRefresh) {
		const cached = cache.get(userId);
		if (cached) {
			return cached;
		}
	}

	// Fetch fresh data
	const context = await getAIFinancialContext(userId, db, userName);

	// Cache the result
	cache.set(userId, context);

	return context;
}

/**
 * Invalidate cached context for a user.
 * Call this after financial data mutations (transactions, budgets, goals).
 *
 * @param userId - User ID to invalidate cache for
 */
export function invalidateFinancialContextCache(userId: string): void {
	const cache = getGlobalCache();
	cache.invalidate(userId);
}

/**
 * Invalidate cache for multiple users at once
 *
 * @param userIds - Array of user IDs to invalidate
 */
export function invalidateMultipleContextCaches(userIds: string[]): void {
	const cache = getGlobalCache();
	for (const userId of userIds) {
		cache.invalidate(userId);
	}
}

/**
 * Clear all cached contexts.
 * Use sparingly - mainly for testing or system-wide invalidation.
 */
export function clearAllContextCaches(): void {
	const cache = getGlobalCache();
	cache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getContextCacheStats(): { size: number; maxEntries: number; ttlMs: number } {
	const cache = getGlobalCache();
	return cache.stats();
}

/**
 * Check if user has cached context
 */
export function hasContextCache(userId: string): boolean {
	const cache = getGlobalCache();
	return cache.has(userId);
}

// ========================================
// EXPORTS
// ========================================

// FinancialContextCache is already exported at class definition (line 48)
