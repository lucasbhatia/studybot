/**
 * Error Handler
 * Centralized error handling with logging and retry logic
 */

class ErrorHandler {
  /**
   * Log error to console and optionally notify user
   */
  static logError(context, error, notifyUser = true) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}]`, error);

    if (notifyUser && typeof notificationManager !== 'undefined') {
      notificationManager.error(`${context}: ${message}`);
    }

    return message;
  }

  /**
   * Wrap async function with error handling
   */
  static async wrapAsync(fn, context = 'Operation', notifyUser = true) {
    try {
      return await fn();
    } catch (error) {
      this.logError(context, error, notifyUser);
      throw error;
    }
  }

  /**
   * Retry async function with exponential backoff
   */
  static async retryAsync(fn, context = 'Operation', maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const delay = baseDelay * Math.pow(2, i); // Exponential backoff

        if (i < maxRetries - 1) {
          console.warn(`${context} failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : String(lastError);
    console.error(`${context} failed after ${maxRetries} retries:`, lastError);

    if (typeof notificationManager !== 'undefined') {
      notificationManager.error(`${context} failed: ${message}`);
    }

    throw lastError;
  }

  /**
   * Validate API response
   */
  static validateResponse(response, context = 'API response') {
    if (!response) {
      throw new Error(`${context}: No response received`);
    }

    if (response.error) {
      throw new Error(`${context}: ${response.error}`);
    }

    return response;
  }

  /**
   * Handle network error
   */
  static handleNetworkError(error, context = 'Network request') {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Error(`${context}: Network unavailable. Please check your connection.`);
    }

    if (error.name === 'AbortError') {
      return new Error(`${context}: Request timeout. Please try again.`);
    }

    return error;
  }

  /**
   * Handle API error
   */
  static async handleAPIError(response, context = 'API') {
    let errorMessage = `${context}: ${response.status} ${response.statusText}`;

    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = `${context}: ${data.error.message || data.error}`;
      } else if (data.message) {
        errorMessage = `${context}: ${data.message}`;
      }
    } catch (e) {
      // Could not parse error response
    }

    return new Error(errorMessage);
  }

  /**
   * Safe JSON parse
   */
  static safeJsonParse(json, context = 'JSON parse') {
    try {
      return JSON.parse(json);
    } catch (error) {
      const message = `${context}: Invalid JSON format`;
      console.error(message, error);
      throw new Error(message);
    }
  }

  /**
   * Safe Chrome storage get
   */
  static async chromeStorageGet(keys, context = 'Chrome storage') {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(`${context}: ${chrome.runtime.lastError.message}`)
            );
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(new Error(`${context}: ${error.message}`));
      }
    });
  }

  /**
   * Safe Chrome storage set
   */
  static async chromeStorageSet(items, context = 'Chrome storage') {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(`${context}: ${chrome.runtime.lastError.message}`)
            );
          } else {
            resolve(true);
          }
        });
      } catch (error) {
        reject(new Error(`${context}: ${error.message}`));
      }
    });
  }

  /**
   * Safe Chrome tabs sendMessage
   */
  static async chromeTabsSendMessage(tabId, message, context = 'Chrome message') {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(`${context}: ${chrome.runtime.lastError.message}`)
            );
          } else if (!response) {
            reject(new Error(`${context}: No response from tab`));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(new Error(`${context}: ${error.message}`));
      }
    });
  }

  /**
   * Validate required fields
   */
  static validateRequired(obj, fields, context = 'Validation') {
    const missing = fields.filter((field) => !obj[field]);

    if (missing.length > 0) {
      throw new Error(
        `${context}: Missing required fields: ${missing.join(', ')}`
      );
    }

    return true;
  }

  /**
   * Validate field types
   */
  static validateTypes(obj, schema, context = 'Type validation') {
    for (const [field, expectedType] of Object.entries(schema)) {
      const actualType = typeof obj[field];

      if (actualType !== expectedType) {
        throw new Error(
          `${context}: Field '${field}' must be ${expectedType}, got ${actualType}`
        );
      }
    }

    return true;
  }

  /**
   * Debounce error spam
   */
  static createDebouncedErrorNotifier(delay = 5000) {
    let timeoutId = null;
    let lastError = null;

    return (error, context = 'Error') => {
      lastError = error;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        this.logError(context, lastError, true);
        timeoutId = null;
      }, delay);
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}
