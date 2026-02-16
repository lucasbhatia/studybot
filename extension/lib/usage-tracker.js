/**
 * Usage Tracker
 * Tracks API usage for freemium tier enforcement
 */

class UsageTracker {
  constructor() {
    this.freeTierLimit = 5; // 5 generations per month
    this.currentMonth = this.getCurrentMonth();
  }

  /**
   * Get current year-month string (YYYY-MM)
   */
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get usage stats for current month
   */
  async getUsage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['usage_month', 'usage_count', 'usage_reset_date'], (result) => {
        const month = this.getCurrentMonth();
        const storedMonth = result.usage_month;
        
        // If month changed, reset counter
        if (storedMonth !== month) {
          chrome.storage.local.set({
            usage_month: month,
            usage_count: 0,
            usage_reset_date: new Date().toISOString(),
          });
          resolve({
            count: 0,
            limit: this.freeTierLimit,
            remaining: this.freeTierLimit,
            percentage: 0,
            resetDate: new Date().toISOString(),
            isLimitReached: false,
          });
        } else {
          const count = result.usage_count || 0;
          const remaining = Math.max(0, this.freeTierLimit - count);
          resolve({
            count,
            limit: this.freeTierLimit,
            remaining,
            percentage: Math.min((count / this.freeTierLimit) * 100, 100),
            resetDate: result.usage_reset_date,
            isLimitReached: remaining <= 0,
          });
        }
      });
    });
  }

  /**
   * Increment usage count
   */
  async incrementUsage() {
    const usage = await this.getUsage();
    
    return new Promise((resolve) => {
      chrome.storage.local.set(
        {
          usage_count: usage.count + 1,
        },
        () => {
          resolve(usage.count + 1);
        }
      );
    });
  }

  /**
   * Check if user can generate more content
   */
  async canGenerate(useBYOK = false) {
    // If using BYOK (Bring Your Own Key), unlimited
    if (useBYOK) {
      return { allowed: true, reason: 'Using own API key' };
    }

    const usage = await this.getUsage();

    if (usage.isLimitReached) {
      return {
        allowed: false,
        reason: `Free tier limit reached (${usage.count}/${usage.limit}). Upgrade or provide your own API key.`,
      };
    }

    return { allowed: true, reason: null };
  }

  /**
   * Reset usage for current month
   */
  async resetUsage() {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        {
          usage_month: this.getCurrentMonth(),
          usage_count: 0,
          usage_reset_date: new Date().toISOString(),
        },
        () => {
          resolve(true);
        }
      );
    });
  }

  /**
   * Get reset date for current month
   */
  getNextResetDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  /**
   * Format usage as percentage bar
   */
  formatUsageBar(usage) {
    const filled = Math.round((usage.percentage / 100) * 20); // 20 blocks
    const empty = 20 - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * Get usage message for display
   */
  async getUsageMessage() {
    const usage = await this.getUsage();
    const bar = this.formatUsageBar(usage);
    const nextReset = this.getNextResetDate();

    return `${bar} ${usage.count}/${usage.limit} generations used\nResets: ${nextReset.toLocaleDateString()}`;
  }

  /**
   * Get tier info
   */
  async getTierInfo() {
    const config = await new ClaudeAPIService().getConfig();
    const usage = await this.getUsage();

    if (config.apiKey) {
      return {
        tier: 'Pro',
        limit: 'Unlimited',
        features: ['Unlimited AI generation', 'Canvas integration', 'Priority support'],
        apiKey: config.apiKey.substring(0, 10) + '...',
      };
    }

    return {
      tier: 'Free',
      limit: `${usage.remaining} generations remaining this month`,
      features: [`${this.freeTierLimit} generations/month`, 'Canvas integration (optional)'],
      upgrade: 'Provide your own API key for unlimited usage',
    };
  }
}

// Create global instance
const usageTracker = new UsageTracker();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UsageTracker;
}
