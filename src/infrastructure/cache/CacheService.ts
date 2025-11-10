/**
 * Cache Service
 * High-level caching service with common patterns for AegisWallet
 */

import type { Transaction, TransactionStatus, TransactionType } from '@/domain/models/Transaction';
import type { User } from '@/domain/models/User';
import { logError } from '@/server/lib/logger';
import { cacheManager, type ICache } from './CacheManager';

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
      logError('cache_get_user', userId, error as Error, { operation: 'getUser' });
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
      logError('cache_set_user', user.id, error as Error, { operation: 'setUser' });
    }
  }

  async invalidateUser(userId: string): Promise<void> {
    try {
      await cacheManager.invalidateByTag(`user:${userId}`, 'users');
    } catch (error) {
      logError('cache_invalidate_user', userId, error as Error, { operation: 'invalidateUser' });
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const cacheKey = `user:email:${email}`;
      return this.userCache.get<User>(cacheKey);
    } catch (error) {
      logError('cache_get_user_by_email', email, error as Error, {
        operation: 'getUserByEmail',
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
      logError('cache_set_user_by_email', email, error as Error, {
        operation: 'setUserByEmail',
      });
    }
  }

  // Transaction caching methods
  async getTransaction(transactionId: string, userId: string): Promise<Transaction | null> {
    try {
      const cacheKey = `transaction:${userId}:${transactionId}`;
      return this.transactionCache.get<Transaction>(cacheKey);
    } catch (error) {
      logError('cache_get_transaction', transactionId, error as Error, {
        operation: 'getTransaction',
        userId,
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
      logError('cache_set_transaction', transaction.id, error as Error, {
        operation: 'setTransaction',
        userId: transaction.userId,
      });
    }
  }

  async getUserTransactions(
    userId: string,
    filters: {
      limit?: number;
      offset?: number;
      type?: TransactionType;
      status?: TransactionStatus;
      categoryId?: string;
      accountId?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ transactions: Transaction[]; totalCount: number } | null> {
    try {
      // Create a cache key based on filters
      const filterKey = JSON.stringify(filters);
      const cacheKey = `user:${userId}:transactions:${Buffer.from(filterKey).toString('base64')}`;

      return this.transactionCache.get<{ transactions: Transaction[]; totalCount: number }>(
        cacheKey
      );
    } catch (error) {
      logError('cache_get_user_transactions', userId, error as Error, {
        operation: 'getUserTransactions',
        filters,
      });
      return null;
    }
  }

  async setUserTransactions(
    userId: string,
    filters: any,
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
      logError('cache_set_user_transactions', userId, error as Error, {
        operation: 'setUserTransactions',
      });
    }
  }

  async invalidateUserTransactions(userId: string): Promise<void> {
    try {
      await cacheManager.invalidateByTag(`user:${userId}`, 'transactions');
    } catch (error) {
      logError('cache_invalidate_user_transactions', userId, error as Error, {
        operation: 'invalidateUserTransactions',
      });
    }
  }

  async invalidateTransaction(transactionId: string, userId: string): Promise<void> {
    try {
      await cacheManager.invalidateByTag(`transaction:${transactionId}`, 'transactions');
    } catch (error) {
      logError('cache_invalidate_transaction', transactionId, error as Error, {
        operation: 'invalidateTransaction',
        userId,
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
      logError('cache_get_transaction_statistics', userId, error as Error, {
        operation: 'getTransactionStatistics',
        period,
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
      logError('cache_set_transaction_statistics', userId, error as Error, {
        operation: 'setTransactionStatistics',
        period,
      });
    }
  }

  // Session caching methods
  async getSession(sessionId: string): Promise<any | null> {
    try {
      return this.sessionCache.get(`session:${sessionId}`);
    } catch (error) {
      logError('cache_get_session', sessionId, error as Error, { operation: 'getSession' });
      return null;
    }
  }

  async setSession(sessionId: string, sessionData: any, ttl: number = 3600000): Promise<void> {
    // 1 hour default
    try {
      await this.sessionCache.set(`session:${sessionId}`, sessionData, { ttl });
    } catch (error) {
      logError('cache_set_session', sessionId, error as Error, { operation: 'setSession' });
    }
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      return this.sessionCache.delete(`session:${sessionId}`);
    } catch (error) {
      logError('cache_invalidate_session', sessionId, error as Error, {
        operation: 'invalidateSession',
      });
      return false;
    }
  }

  // API response caching methods
  async getApiResponse(key: string): Promise<any | null> {
    try {
      return this.apiCache.get(key);
    } catch (error) {
      logError('cache_get_api_response', key, error as Error, { operation: 'getApiResponse' });
      return null;
    }
  }

  async setApiResponse(key: string, data: any, ttl: number = 300000): Promise<void> {
    // 5 minutes default
    try {
      await this.apiCache.set(key, data, { ttl, tags: ['api'] });
    } catch (error) {
      logError('cache_set_api_response', key, error as Error, { operation: 'setApiResponse' });
    }
  }

  async invalidateApiResponses(): Promise<void> {
    try {
      await cacheManager.invalidateByTag('api', 'api');
    } catch (error) {
      logError('cache_invalidate_api_responses', 'system', error as Error, {
        operation: 'invalidateApiResponses',
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
      logError('cache_get_or_set', key, error as Error, { operation: 'getOrSet' });
      return factory(); // Fallback to direct execution
    }
  }

  // Cache statistics
  getCacheStats(): {
    users: any;
    transactions: any;
    sessions: any;
    api: any;
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
      logError('cache_clear', cacheName || 'all', error as Error, { operation: 'clearCache' });
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
