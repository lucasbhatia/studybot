/**
 * Error Boundary
 * Catches and handles errors in UI components gracefully
 */

class ErrorBoundary {
  /**
   * Wrap async function with error recovery
   */
  static async wrapAsync(fn, context = 'Operation', onError = null) {
    try {
      return await fn();
    } catch (error) {
      console.error(`[${context}]`, error);
      
      if (onError) {
        onError(error);
      }
      
      // Show user-friendly error message
      if (typeof notificationManager !== 'undefined') {
        const message = error.message || 'An unexpected error occurred';
        notificationManager.error(`${context}: ${message}`);
      }
      
      return null;
    }
  }

  /**
   * Show error UI with retry option
   */
  static showErrorUI(container, error, onRetry) {
    if (!container) return;
    
    const message = error instanceof Error ? error.message : String(error);
    
    container.innerHTML = `
      <div class="error-state" style="
        padding: 24px;
        text-align: center;
        color: var(--danger, #EF4444);
      ">
        <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">Something went wrong</h3>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: var(--secondary, #6B7280);">
          ${this.escapeHtml(message)}
        </p>
        ${onRetry ? `
          <button id="retry-btn" style="
            background: var(--primary, #3B82F6);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
          ">
            Try Again
          </button>
        ` : ''}
      </div>
    `;
    
    if (onRetry) {
      container.querySelector('#retry-btn').addEventListener('click', onRetry);
    }
  }

  /**
   * Show loading state
   */
  static showLoading(container, message = 'Loading...') {
    if (!container) return;
    
    container.innerHTML = `
      <div class="loading-state" style="
        padding: 24px;
        text-align: center;
        color: var(--secondary, #6B7280);
      ">
        <div style="
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-dark, #374151);
          border-top-color: var(--primary, #3B82F6);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        "></div>
        <p style="margin: 0; font-size: 13px;">${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Show empty state
   */
  static showEmptyState(container, icon, title, description, action = null) {
    if (!container) return;
    
    container.innerHTML = `
      <div class="empty-state" style="
        padding: 40px 24px;
        text-align: center;
        color: var(--secondary, #6B7280);
      ">
        <div style="font-size: 48px; margin-bottom: 12px;">${icon}</div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: var(--text-light, #F9FAFB);">
          ${this.escapeHtml(title)}
        </h3>
        <p style="margin: 0 ${action ? '0 16px 0' : '0'}; font-size: 13px;">
          ${this.escapeHtml(description)}
        </p>
        ${action ? `
          <button id="action-btn" style="
            margin-top: 12px;
            background: var(--primary, #3B82F6);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
          ">
            ${this.escapeHtml(action.label)}
          </button>
        ` : ''}
      </div>
    `;
    
    if (action && action.onClick) {
      container.querySelector('#action-btn').addEventListener('click', action.onClick);
    }
  }

  /**
   * Safe DOM manipulation
   */
  static safeSetInnerHTML(element, html) {
    if (!element) return;
    
    try {
      // Create a temporary container
      const temp = document.createElement('div');
      temp.innerHTML = html;
      
      // Clear and append
      element.innerHTML = '';
      while (temp.firstChild) {
        element.appendChild(temp.firstChild);
      }
    } catch (error) {
      console.error('Failed to set innerHTML:', error);
      element.textContent = 'Content could not be displayed';
    }
  }

  /**
   * Escape HTML
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Safe event listener
   */
  static addEventListener(element, event, handler) {
    if (!element) return;
    try {
      element.addEventListener(event, handler);
    } catch (error) {
      console.error(`Failed to attach ${event} listener:`, error);
    }
  }

  /**
   * Safe element removal
   */
  static safeRemove(element) {
    if (!element) return;
    try {
      if (element.remove) {
        element.remove();
      } else if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    } catch (error) {
      console.error('Failed to remove element:', error);
    }
  }

  /**
   * Validate element exists and is visible
   */
  static isElementValid(element) {
    if (!element) return false;
    if (!(element instanceof Element)) return false;
    if (!document.contains(element)) return false;
    return true;
  }
}

// Add spin animation if not present
if (!document.getElementById('error-boundary-styles')) {
  const style = document.createElement('style');
  style.id = 'error-boundary-styles';
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}
