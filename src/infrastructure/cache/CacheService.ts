/**
 * Cache Service
 * High-level caching service with common patterns for AegisWallet
 */

import type { Transaction, TransactionStatus, TransactionType } from '@/domain/models/Transaction';
import type { User } from '@/domain/models/User';
import { logger } from '@/lib/logging/logger';
import { cacheManager, type ICache } from './CacheManager';

type TransactionFilters = {
  limit?: number;
  offset?: number;
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
};

export class CacheService {
  private readonly userCache: ICache;
  private readonly transactionCache: ICache;
  private readonly sessionCache: ICache;
  private readonly apiCache: ICache;

  constructor() {
    // Initialize different cache instances for different purposes
    this.userCache = cacheManager.getCache('users');
    this.transactionCache = cacheManager.getCache('transactions');
    this.sessionCache = cacheManager.getCache('sessions');
    this.apiCache = cacheManager.getCache('api');
  }

  // User caching methods
  async getUser(userId: string): Promise<User | null> {
    try {
      const cacheKey = `user:${userId}`;
      return this.userCache.get<User>(cacheKey);
    } catch (error) {
      logger.error('cache_get_user failed', {
        operation: 'getUser',
        userId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async setUser(user: User, ttl: number = 300000): Promise<void> {
    // 5 minutes default
    try {
      const cacheKey = `user:${user.id}`;
      await this.userCache.set(cacheKey, user, {
        ttl,
        tags: ['user', `user:${user.id}`],
      });
    } catch (error) {
      logger.error('cache_set_user failed', {
        operation: 'setUser',
        userId: user.id,
        error: (error as Error).message,
      });
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    try {
      await cacheManager.invalidateByTag(`user:${userId}`, 'users');
    } catch (error) {
      logger.error('cache_invalidate_user failed', {
        operation: 'invalidateUser',
        userId,
        error: (error as Error).message,
      });
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const cacheKey = `user:email:${email}`;
      return this.userCache.get<User>(cacheKey);
    } catch (error) {
      logger.error('cache_get_user_by_email failed', {
        operation: 'getUserByEmail',
        email,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async setUserByEmail(email: string, user: User, ttl: number = 300000): Promise<void> {
    try {
      const cacheKey = `user:email:${email}`;
      await this.userCache.set(cacheKey, user, {
        ttl,
        tags: ['user', 'user:email', `user:${user.id}`],
      });
    } catch (error) {
      logger.error('cache_set_user_by_email failed', {
        operation: 'setUserByEmail',
        email,
        error: (error as Error).message,
      });
    }
  }

  // Transaction caching methods
  async getTransaction(transactionId: string, userId: string): Promise<Transaction | null> {
    try {
      const cacheKey = `transaction:${userId}:${transactionId}`;
      return this.transactionCache.get<Transaction>(cacheKey);
    } catch (error) {
      logger.error('cache_get_transaction failed', {
        operation: 'getTransaction',
        transactionId,
        userId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async setTransaction(transaction: Transaction, ttl: number = 600000): Promise<void> {
    // 10 minutes default
    try {
      const cacheKey = `transaction:${transaction.userId}:${transaction.id}`;
      await this.transactionCache.set(cacheKey, transaction, {
        ttl,
        tags: ['transaction', `user:${transaction.userId}`, `transaction:${transaction.id}`],
      });
    } catch (error) {
      logger.error('cache_set_transaction failed', {
        operation: 'setTransaction',
        transactionId: transaction.id,
        userId: transaction.userId,
        error: (error as Error).message,
      });
    }
  }

  async getUserTransactions(
    userId: string,
    filters: TransactionFilters
  ): Promise<{ transactions: Transaction[]; totalCount: number } | null> {
    try {
      // Create a cache key based on filters
      const filterKey = JSON.stringify(filters);
      const cacheKey = `user:${userId}:transactions:${Buffer.from(filterKey).toString('base64')}`;

      return this.transactionCache.get<{ transactions: Transaction[]; totalCount: number }>(
        cacheKey
      );
    } catch (error) {
      logger.error('cache_get_user_transactions failed', {
        operation: 'getUserTransactions',
        userId,
        filters,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async setUserTransactions(
    userId: string,
    filters: TransactionFilters,
    result: { transactions: Transaction[]; totalCount: number },
    ttl: number = 180000 // 3 minutes default
  ): Promise<void> {
    try {
      const filterKey = JSON.stringify(filters);
      const cacheKey = `user:${userId}:transactions:${Buffer.from(filterKey).toString('base64')}`;

      await this.transactionCache.set(cacheKey, result, {
        ttl,
        tags: ['transactions', `user:${userId}`],
      });
    } catch (error) {
      logger.error('cache_set_user_transactions failed', {
        operation: 'setUserTransactions',
        userId,
        error: (error as Error).message,
      });
    }
  }

  async invalidateUserTransactions(userId: string): Promise<void> {
    try {
      await cacheManager.invalidateByTag(`user:${userId}`, 'transactions');
    } catch (error) {
      logger.error('cache_invalidate_user_transactions failed', {
        operation: 'invalidateUserTransactions',
        userId,
        error: (error as Error).message,
      });
    }
  }

  async invalidateTransaction(transactionId: string, userId: string): Promise<void> {
    try {
      await cacheManager.invalidateByTag(`transaction:${transactionId}`, 'transactions');
    } catch (error) {
      logger.error('cache_invalidate_transaction failed', {
        operation: 'invalidateTransaction',
        transactionId,
        userId,
        error: (error as Error).message,
      });
    }
  }

  // Transaction statistics caching
  async getTransactionStatistics(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<{
    income: number;
    expenses: number;
    balance: number;
    transactionCount: number;
    averageTransaction: number;
  } | null> {
    try {
      const cacheKey = `user:${userId}:stats:${period}`;
      return this.transactionCache.get(cacheKey);
    } catch (error) {
      logger.error('cache_get_transaction_statistics failed', {
        operation: 'getTransactionStatistics',
        userId,
        period,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async setTransactionStatistics(
    userId: string,
    period: 'week' | 'month' | 'quarter' | 'year',
    statistics: {
      income: number;
      expenses: number;
      balance: number;
      transactionCount: number;
      averageTransaction: number;
    },
    ttl: number = 900000 // 15 minutes default
  ): Promise<void> {
    try {
      const cacheKey = `user:${userId}:stats:${period}`;
      await this.transactionCache.set(cacheKey, statistics, {
        ttl,
        tags: ['statistics', `user:${userId}`],
      });
    } catch (error) {
      logger.error('cache_set_transaction_statistics failed', {
        operation: 'setTransactionStatistics',
        userId,
        period,
        error: (error as Error).message,
      });
    }
  }

  // Session caching methods
  async getSession<T = unknown>(sessionId: string): Promise<T | null> {
    try {
      return this.sessionCache.get<T>(`session:${sessionId}`);
    } catch (error) {
      logger.error('cache_get_session failed', {
        operation: 'getSession',
        sessionId,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async setSession<T = unknown>(
    sessionId: string,
    sessionData: T,
    ttl: number = 3600000
  ): Promise<void> {
    // 1 hour default
    try {
      await this.sessionCache.set(`session:${sessionId}`, sessionData, { ttl });
    } catch (error) {
      logger.error('cache_set_session failed', {
        operation: 'setSession',
        sessionId,
        error: (error as Error).message,
      });
    }
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      return this.sessionCache.delete(`session:${sessionId}`);
    } catch (error) {
      logger.error('cache_invalidate_session failed', {
        operation: 'invalidateSession',
        sessionId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  // API response caching methods
  async getApiResponse<T = unknown>(key: string): Promise<T | null> {
    try {
      return this.apiCache.get<T>(key);
    } catch (error) {
      logger.error('cache_get_api_response failed', {
        operation: 'getApiResponse',
        key,
        error: (error as Error).message,
      });
      return null;
    }
  }

  async setApiResponse<T = unknown>(key: string, data: T, ttl: number = 300000): Promise<void> {
    // 5 minutes default
    try {
      await this.apiCache.set(key, data, { ttl, tags: ['api'] });
    } catch (error) {
      logger.error('cache_set_api_response failed', {
        operation: 'setApiResponse',
        key,
        error: (error as Error).message,
      });
    }
  }

  async invalidateApiResponses(): Promise<void> {
    try {
      await cacheManager.invalidateByTag('api', 'api');
    } catch (error) {
      logger.error('cache_invalidate_api_responses failed', {
        operation: 'invalidateApiResponses',
        key: 'system',
        error: (error as Error).message,
      });
    }
  }

  // Cache utility methods
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: { ttl?: number; tags?: string[]; cacheName?: string } = {}
  ): Promise<T> {
    try {
      return cacheManager.getOrSet(key, factory, options, options.cacheName);
    } catch (error) {
      logger.error('cache_get_or_set failed', {
        operation: 'getOrSet',
        key,
        error: (error as Error).message,
      });
      return factory(); // Fallback to direct execution
    }
  }

  // Cache statistics
  getCacheStats(): {
    users: ReturnType<ICache['getStats']>;
    transactions: ReturnType<ICache['getStats']>;
    sessions: ReturnType<ICache['getStats']>;
    api: ReturnType<ICache['getStats']>;
  } {
    return {
      users: this.userCache.getStats(),
      transactions: this.transactionCache.getStats(),
      sessions: this.sessionCache.getStats(),
      api: this.apiCache.getStats(),
    };
  }

  // Cache cleanup
  async clearCache(cacheName?: 'users' | 'transactions' | 'sessions' | 'api'): Promise<void> {
    try {
      if (cacheName) {
        switch (cacheName) {
          case 'users':
            await this.userCache.clear();
            break;
          case 'transactions':
            await this.transactionCache.clear();
            break;
          case 'sessions':
            await this.sessionCache.clear();
            break;
          case 'api':
            await this.apiCache.clear();
            break;
        }
      } else {
        // Clear all caches
        await Promise.all([
          this.userCache.clear(),
          this.transactionCache.clear(),
          this.sessionCache.clear(),
          this.apiCache.clear(),
        ]);
      }
    } catch (error) {
      logger.error('cache_clear failed', {
        operation: 'clearCache',
        cacheName: cacheName || 'all',
        error: (error as Error).message,
      });
    }
  }

  // Cache warming methods
  async warmUserCache(_userId: string, userData: User): Promise<void> {
    await Promise.all([this.setUser(userData), this.setUserByEmail(userData.email, userData)]);
  }

  async warmTransactionCache(_userId: string, transactions: Transaction[]): Promise<void> {
    await Promise.all(transactions.map((transaction) => this.setTransaction(transaction)));
  }
}

/**
 * Global cache service instance
 */
export const cacheService = new CacheService();
