/**
 * Debouncer & Throttler
 * Utility functions to prevent excessive API calls and improve performance
 */

class DebouncerManager {
  constructor() {
    this.timers = new Map();
    this.lastCalls = new Map();
  }

  /**
   * Debounce a function
   * Delays execution until X milliseconds have passed without new calls
   */
  debounce(fn, delay = 300, context = null) {
    return (...args) => {
      const id = fn.name || Math.random().toString();
      
      if (this.timers.has(id)) {
        clearTimeout(this.timers.get(id));
      }

      const timerId = setTimeout(() => {
        fn.apply(context, args);
        this.timers.delete(id);
      }, delay);

      this.timers.set(id, timerId);
    };
  }

  /**
   * Debounce async function
   */
  debounceAsync(fn, delay = 300, context = null) {
    let timeoutId = null;
    let lastPromise = null;

    return (...args) => {
      return new Promise((resolve, reject) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          try {
            lastPromise = fn.apply(context, args);
            const result = await lastPromise;
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            timeoutId = null;
          }
        }, delay);
      });
    };
  }

  /**
   * Throttle a function
   * Ensures function is called at most once every X milliseconds
   */
  throttle(fn, delay = 300, context = null) {
    const id = fn.name || Math.random().toString();
    
    return (...args) => {
      const now = Date.now();
      const lastCall = this.lastCalls.get(id) || 0;

      if (now - lastCall >= delay) {
        this.lastCalls.set(id, now);
        fn.apply(context, args);
      } else {
        // Schedule for later
        if (this.timers.has(id)) {
          clearTimeout(this.timers.get(id));
        }

        const timerId = setTimeout(() => {
          this.lastCalls.set(id, Date.now());
          fn.apply(context, args);
          this.timers.delete(id);
        }, delay - (now - lastCall));

        this.timers.set(id, timerId);
      }
    };
  }

  /**
   * Throttle async function
   */
  throttleAsync(fn, delay = 300, context = null) {
    const id = fn.name || Math.random().toString();
    let lastCall = 0;
    let isExecuting = false;

    return async (...args) => {
      const now = Date.now();

      if (now - lastCall < delay && isExecuting) {
        return null; // Skip this call
      }

      lastCall = now;
      isExecuting = true;

      try {
        const result = await fn.apply(context, args);
        return result;
      } finally {
        isExecuting = false;
      }
    };
  }

  /**
   * Rate limit a function
   * Executes function immediately but limits call frequency
   */
  rateLimit(fn, maxCalls = 5, timeWindowMs = 1000, context = null) {
    const id = fn.name || Math.random().toString();
    const calls = [];

    return (...args) => {
      const now = Date.now();
      
      // Remove old calls outside the window
      while (calls.length > 0 && calls[0] < now - timeWindowMs) {
        calls.shift();
      }

      if (calls.length < maxCalls) {
        calls.push(now);
        return fn.apply(context, args);
      } else {
        console.warn(`Rate limit exceeded for ${id}`);
        return null;
      }
    };
  }

  /**
   * Debounce with immediate execution
   * Executes immediately and prevents re-execution for X milliseconds
   */
  debounceLeading(fn, delay = 300, context = null) {
    const id = fn.name || Math.random().toString();
    let lastCall = 0;

    return (...args) => {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        fn.apply(context, args);
      }
    };
  }

  /**
   * Debounce with trailing execution
   * Executes after delay and also executes any pending call on cancel
   */
  debounceTrailing(fn, delay = 300, context = null) {
    let timeoutId = null;

    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        fn.apply(context, args);
        timeoutId = null;
      }, delay);
    };
  }

  /**
   * Cancel pending operations for a function
   */
  cancel(fnName) {
    if (this.timers.has(fnName)) {
      clearTimeout(this.timers.get(fnName));
      this.timers.delete(fnName);
    }
  }

  /**
   * Cancel all pending operations
   */
  cancelAll() {
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId);
    }
    this.timers.clear();
  }

  /**
   * Create a debounced search function
   * Common pattern for input searches
   */
  createSearchDebouncer(searchFn, delay = 300) {
    let timeoutId = null;
    let lastQuery = '';

    return async (query) => {
      if (query === lastQuery) return; // Skip if same query

      lastQuery = query;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!query.trim()) {
        return []; // Return empty for empty queries
      }

      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          try {
            const results = await searchFn(query);
            resolve(results);
          } catch (error) {
            console.error('Search failed:', error);
            resolve([]);
          }
        }, delay);
      });
    };
  }

  /**
   * Create a debounced form validator
   */
  createFormValidator(validateFn, delay = 500) {
    let timeoutId = null;

    return async (formData) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          try {
            const errors = await validateFn(formData);
            resolve(errors);
          } catch (error) {
            console.error('Validation failed:', error);
            resolve({});
          }
        }, delay);
      });
    };
  }

  /**
   * Get number of pending operations
   */
  getPendingCount() {
    return this.timers.size;
  }

  /**
   * Check if operation is pending
   */
  isPending(fnName) {
    return this.timers.has(fnName);
  }
}

// Create global instance
const debouncerManager = new DebouncerManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebouncerManager;
}
