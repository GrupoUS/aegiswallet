/**
 * Cache Manager
 * Provides unified caching interface with multiple backends
 */

export interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  maxSize?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  size: number;
  memoryUsage: number;
}

/**
 * Abstract Cache Interface
 */
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  getStats(): CacheStats;
  getEntry<T>(key: string): Promise<CacheEntry<T> | null>;
  deleteByTag(tag: string): Promise<number>;
}

/**
 * Memory Cache Implementation
 */
export class MemoryCache implements ICache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0,
    size: 0,
    memoryUsage: 0,
  };
  private cleanupInterval: NodeJS.Timeout;
  private maxEntries: number;
  private maxMemory: number; // in bytes

  constructor(options: { maxEntries?: number; maxMemory?: number; cleanupInterval?: number } = {}) {
    this.maxEntries = options.maxEntries || 1000;
    this.maxMemory = options.maxMemory || 50 * 1024 * 1024; // 50MB
    this.cleanupInterval = setInterval(() => this.cleanup(), options.cleanupInterval || 60000); // 1 minute
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();
    return entry.data as T;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const now = Date.now();
    const ttl = options.ttl || 300000; // 5 minutes default
    const expiresAt = now + ttl;

    const entry: CacheEntry<T> = {
      data: value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
      tags: options.tags,
    };

    // Check memory limits
    if (this.shouldEvict()) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
    this.stats.sets++;
    this.updateStats();
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: 0,
      memoryUsage: 0,
    };
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());

    if (!pattern) return allKeys;

    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter((key) => regex.test(key));
  }

  async getEntry<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  async deleteByTag(tag: string): Promise<number> {
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    this.stats.deletes += deletedCount;
    this.updateStats();
    return deletedCount;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.stats.evictions += cleanedCount;
      this.updateStats();
    }
  }

  private shouldEvict(): boolean {
    return this.cache.size >= this.maxEntries || this.getMemoryUsage() >= this.maxMemory;
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.updateStats();
    }
  }

  private getMemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      try {
        totalSize += JSON.stringify(entry).length * 2; // UTF-16 characters
      } catch {
        // If stringify fails, estimate
        totalSize += 1024; // 1KB estimate
      }
    }

    return totalSize;
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = this.getMemoryUsage();
    this.updateHitRate();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Cache Manager with multiple backends
 */
export class CacheManager {
  private caches = new Map<string, ICache>();
  private defaultCache: ICache;

  constructor(defaultCache?: ICache) {
    this.defaultCache = defaultCache || new MemoryCache();
    this.caches.set('default', this.defaultCache);
  }

  /**
   * Get a cache instance by name
   */
  getCache(name: string = 'default'): ICache {
    return this.caches.get(name) || this.defaultCache;
  }

  /**
   * Register a new cache instance
   */
  registerCache(name: string, cache: ICache): void {
    this.caches.set(name, cache);
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, cacheName: string = 'default'): Promise<T | null> {
    const cache = this.getCache(cacheName);
    return cache.get<T>(key);
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
    cacheName: string = 'default'
  ): Promise<void> {
    const cache = this.getCache(cacheName);
    return cache.set(key, value, options);
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, cacheName: string = 'default'): Promise<boolean> {
    const cache = this.getCache(cacheName);
    return cache.delete(key);
  }

  /**
   * Clear cache
   */
  async clear(cacheName?: string): Promise<void> {
    if (cacheName) {
      const cache = this.getCache(cacheName);
      return cache.clear();
    }
    // Clear all caches
    await Promise.all(Array.from(this.caches.values()).map((cache) => cache.clear()));
  }

  /**
   * Get or set pattern - get from cache or compute and store
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
    cacheName: string = 'default'
  ): Promise<T> {
    const cache = this.getCache(cacheName);
    const cached = await cache.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await cache.set(key, value, options);
    return value;
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string, cacheName?: string): Promise<number> {
    if (cacheName) {
      const cache = this.getCache(cacheName);
      return cache.deleteByTag(tag);
    }
    // Invalidate in all caches that support tag deletion
    let totalDeleted = 0;
    for (const cache of this.caches.values()) {
      if ('deleteByTag' in cache) {
        totalDeleted += await cache.deleteByTag(tag);
      }
    }
    return totalDeleted;
  }

  /**
   * Get cache statistics
   */
  getStats(cacheName: string = 'default'): CacheStats {
    const cache = this.getCache(cacheName);
    return cache.getStats();
  }

  /**
   * Get all cache statistics
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};

    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }

    return stats;
  }
}

/**
 * Global cache manager instance
 */
export const cacheManager = new CacheManager();

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  options: {
    keyPrefix?: string;
    ttl?: number;
    tags?: string[];
    cacheName?: string;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
) {
  return (_target: object, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const keyGenerator =
        options.keyGenerator ||
        ((...args: Parameters<T>) => {
          return `${options.keyPrefix || propertyName}:${JSON.stringify(args)}`;
        });

      const key = keyGenerator(...args);

      return cacheManager.getOrSet(
        key,
        () => method.apply(this, args),
        {
          ttl: options.ttl,
          tags: options.tags,
        },
        options.cacheName
      );
    };

    return descriptor;
  };
}
