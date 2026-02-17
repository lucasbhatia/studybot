/**
 * Cache Manager
 * Efficient caching with expiration for generated content and API responses
 */

class CacheManager {
  constructor(maxSize = 50 * 1024 * 1024) { // 50MB max
    this.maxSize = maxSize;
    this.cache = new Map();
    this.init();
  }

  /**
   * Initialize cache from storage
   */
  async init() {
    try {
      const result = await chrome.storage.local.get('_cache');
      if (result._cache) {
        const cached = JSON.parse(result._cache);
        for (const [key, value] of Object.entries(cached)) {
          this.cache.set(key, value);
        }
        // Cleanup expired items
        this.cleanupExpired();
      }
    } catch (error) {
      console.error('Failed to initialize cache:', error);
    }
  }

  /**
   * Save cache to storage
   */
  async save() {
    try {
      const cacheObj = {};
      for (const [key, value] of this.cache) {
        cacheObj[key] = value;
      }
      await chrome.storage.local.set({ '_cache': JSON.stringify(cacheObj) });
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  /**
   * Get item from cache
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check expiration
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set item in cache
   */
  set(key, data, ttlMs = 24 * 60 * 60 * 1000) { // 24 hours default
    const item = {
      data,
      createdAt: Date.now(),
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    };

    this.cache.set(key, item);
    
    // Try to save to storage
    this.save().catch(err => console.warn('Cache save failed:', err));

    return this;
  }

  /**
   * Delete item from cache
   */
  delete(key) {
    this.cache.delete(key);
    this.save().catch(err => console.warn('Cache save failed:', err));
    return this;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    chrome.storage.local.remove('_cache').catch(err => console.warn('Cache clear failed:', err));
    return this;
  }

  /**
   * Cleanup expired items
   */
  cleanupExpired() {
    const now = Date.now();
    const expired = [];

    for (const [key, item] of this.cache) {
      if (item.expiresAt && item.expiresAt < now) {
        expired.push(key);
      }
    }

    expired.forEach(key => this.cache.delete(key));

    if (expired.length > 0) {
      this.save().catch(err => console.warn('Cache cleanup save failed:', err));
    }

    return expired.length;
  }

  /**
   * Get or fetch with cache
   */
  async getOrFetch(key, fetchFn, ttlMs = 24 * 60 * 60 * 1000) {
    // Try cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    try {
      const data = await fetchFn();
      this.set(key, data, ttlMs);
      return data;
    } catch (error) {
      // Return stale cache if fetch fails (offline mode)
      const stale = this.cache.get(key);
      if (stale) {
        console.warn(`Using stale cache for ${key} due to fetch error:`, error);
        return stale.data;
      }
      throw error;
    }
  }

  /**
   * Cache API response
   */
  cacheAPIResponse(endpoint, response, ttlMs = 60 * 60 * 1000) { // 1 hour default
    const key = `api_${endpoint}`;
    this.set(key, response, ttlMs);
    return this;
  }

  /**
   * Get cached API response
   */
  getCachedAPI(endpoint) {
    const key = `api_${endpoint}`;
    return this.get(key);
  }

  /**
   * Cache generated content
   */
  cacheGenerated(contentHash, generated, ttlMs = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const key = `gen_${contentHash}`;
    this.set(key, generated, ttlMs);
    return this;
  }

  /**
   * Get cached generated content
   */
  getCachedGenerated(contentHash) {
    const key = `gen_${contentHash}`;
    return this.get(key);
  }

  /**
   * Get cache stats
   */
  getStats() {
    let totalSize = 0;
    let itemCount = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [, item] of this.cache) {
      itemCount++;
      try {
        totalSize += JSON.stringify(item).length;
      } catch (e) {
        // Ignore serialization errors
      }

      if (item.expiresAt && item.expiresAt < now) {
        expiredCount++;
      }
    }

    return {
      itemCount,
      expiredCount,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      maxSizeMB: (this.maxSize / 1024 / 1024).toFixed(2),
      percentageUsed: ((totalSize / this.maxSize) * 100).toFixed(2),
    };
  }

  /**
   * Evict oldest items if over size limit
   */
  evictOldest() {
    let totalSize = 0;

    for (const item of this.cache.values()) {
      try {
        totalSize += JSON.stringify(item).length;
      } catch (e) {
        // Ignore
      }
    }

    if (totalSize > this.maxSize) {
      // Sort by creation time (oldest first)
      const sorted = Array.from(this.cache.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);

      // Remove oldest items until under limit
      while (totalSize > this.maxSize && sorted.length > 0) {
        const [key, item] = sorted.shift();
        try {
          totalSize -= JSON.stringify(item).length;
        } catch (e) {
          // Ignore
        }
        this.cache.delete(key);
      }

      this.save().catch(err => console.warn('Cache eviction save failed:', err));
    }

    return this;
  }

  /**
   * Generate hash for content
   */
  static hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Create global instance
const cacheManager = new CacheManager();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  cacheManager.init().catch(err => console.warn('Cache initialization failed:', err));
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheManager;
}
