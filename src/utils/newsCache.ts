
interface CachedNewsData {
  items: any[];
  timestamp: number;
  expirationTime: number;
}

const CACHE_KEY = 'aegis_news_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export class NewsCache {
  static set(items: any[]): void {
    const now = Date.now();
    const cacheData: CachedNewsData = {
      items,
      timestamp: now,
      expirationTime: now + CACHE_DURATION
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache news data:', error);
    }
  }

  static get(): any[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CachedNewsData = JSON.parse(cached);
      const now = Date.now();

      if (now > cacheData.expirationTime) {
        this.clear();
        return null;
      }

      return cacheData.items;
    } catch (error) {
      console.warn('Failed to get cached news data:', error);
      this.clear();
      return null;
    }
  }

  static isRecent(): boolean {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;

      const cacheData: CachedNewsData = JSON.parse(cached);
      const now = Date.now();
      const recentThreshold = 15 * 60 * 1000; // 15 minutes

      return (now - cacheData.timestamp) < recentThreshold;
    } catch (error) {
      return false;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear news cache:', error);
    }
  }
}
