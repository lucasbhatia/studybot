/**
 * UI State Manager
 * Manages loading states, transitions, and UI feedback
 */

class UIStateManager {
  constructor() {
    this.states = new Map();
    this.pendingOperations = new Set();
  }

  /**
   * Set element state
   */
  setState(elementId, state) {
    this.states.set(elementId, state);
    return this;
  }

  /**
   * Get element state
   */
  getState(elementId) {
    return this.states.get(elementId) || 'idle';
  }

  /**
   * Track pending operation
   */
  addPending(operationId) {
    this.pendingOperations.add(operationId);
  }

  /**
   * Remove pending operation
   */
  removePending(operationId) {
    this.pendingOperations.delete(operationId);
  }

  /**
   * Check if any operations pending
   */
  hasPending() {
    return this.pendingOperations.size > 0;
  }

  /**
   * Show loading button state
   */
  setButtonLoading(button, isLoading = true) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';
      button.dataset.originalText = button.textContent;
      button.innerHTML = `
        <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px;"></span>
        ${button.textContent}
      `;
    } else {
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }

  /**
   * Reset button to original state
   */
  resetButton(button) {
    if (!button) return;
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }

  /**
   * Enable/disable button group
   */
  setButtonGroupEnabled(selector, enabled = true) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.disabled = !enabled;
      btn.style.opacity = enabled ? '1' : '0.5';
      btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    });
  }

  /**
   * Show smooth transition
   */
  async transition(element, from, to, duration = 300) {
    if (!element) return;

    element.style.opacity = '0';
    element.style.transform = 'translateY(10px)';
    element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;

    // Trigger layout
    void element.offsetHeight;

    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';

    return new Promise(resolve => {
      setTimeout(resolve, duration);
    });
  }

  /**
   * Show/hide element with fade
   */
  setVisible(element, visible = true, duration = 300) {
    if (!element) return;

    element.style.transition = `opacity ${duration}ms ease-out`;

    if (visible) {
      element.style.display = 'block';
      void element.offsetHeight; // Trigger layout
      element.style.opacity = '1';
    } else {
      element.style.opacity = '0';
      setTimeout(() => {
        if (element.style.opacity === '0') {
          element.style.display = 'none';
        }
      }, duration);
    }
  }

  /**
   * Add loading class
   */
  addClass(element, className) {
    if (!element) return;
    element.classList.add(className);
  }

  /**
   * Remove loading class
   */
  removeClass(element, className) {
    if (!element) return;
    element.classList.remove(className);
  }

  /**
   * Toggle class
   */
  toggleClass(element, className) {
    if (!element) return;
    element.classList.toggle(className);
  }

  /**
   * Set loading indicator
   */
  showLoading(container, message = 'Loading...') {
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state" style="
        padding: 20px;
        text-align: center;
        color: var(--secondary, #6B7280);
      ">
        <div class="spinner"></div>
        <p style="margin-top: 12px; font-size: 13px;">${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  /**
   * Escape HTML safely
   */
  escapeHtml(text) {
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
   * Debounce function
   */
  debounce(fn, delay = 300) {
    let timeoutId;
    return function debounced(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Throttle function
   */
  throttle(fn, delay = 300) {
    let lastCall = 0;
    let timeoutId;
    return function throttled(...args) {
      const now = Date.now();
      if (now - lastCall < delay) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastCall = now;
          fn.apply(this, args);
        }, delay - (now - lastCall));
      } else {
        lastCall = now;
        fn.apply(this, args);
      }
    };
  }

  /**
   * Safely focus element
   */
  focusElement(element) {
    if (!element) return;
    try {
      element.focus();
    } catch (error) {
      console.error('Failed to focus element:', error);
    }
  }

  /**
   * Get element dimensions
   */
  getRect(element) {
    if (!element) return null;
    return element.getBoundingClientRect();
  }

  /**
   * Check if element is in viewport
   */
  isInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Scroll into view smoothly
   */
  scrollIntoView(element) {
    if (!element) return;
    try {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      console.error('Failed to scroll into view:', error);
    }
  }
}

// Create global instance
const uiStateManager = new UIStateManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIStateManager;
}
