/**
 * Notification Manager
 * Shows toast notifications for user feedback
 */

class NotificationManager {
  constructor() {
    this.container = null;
    this.init();
  }

  /**
   * Initialize notification container
   */
  init() {
    // Check if container already exists
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
    this.container = container;
  }

  /**
   * Show notification
   */
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const iconMap = {
      success: '✓',
      error: '✗',
      info: 'ℹ',
      warning: '⚠',
    };

    const colorMap = {
      success: '#4caf50',
      error: '#f44336',
      info: '#2196f3',
      warning: '#ff9800',
    };

    notification.style.cssText = `
      padding: 12px 16px;
      background: ${colorMap[type] || colorMap.info};
      color: white;
      border-radius: 4px;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      animation: slideInRight 0.3s ease;
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    notification.innerHTML = `
      <span style="font-weight: bold; font-size: 16px;">${iconMap[type] || '•'}</span>
      <span>${this.escapeHtml(message)}</span>
    `;

    this.container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, duration);
    }

    return notification;
  }

  /**
   * Show success notification
   */
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error notification
   */
  error(message, duration = 4000) {
    return this.show(message, 'error', duration);
  }

  /**
   * Show info notification
   */
  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  /**
   * Show warning notification
   */
  warning(message, duration = 3000) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

// Add CSS animations to document if not already present
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Create global instance
const notificationManager = new NotificationManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}
