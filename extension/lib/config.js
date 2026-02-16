/**
 * StudyBot Configuration
 * Central place for all app configuration and constants
 */

const STUDYBOT_CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',

  // API Endpoints
  PROXY_URL: 'https://api.studybot.dev/v1',

  // Extension Configuration
  VERSION: '1.0.0',
  EXTENSION_ID: chrome.runtime.id,

  // Auth Configuration
  AUTH_CALLBACK_URL: chrome.runtime.getURL('auth/callback.html'),

  // Free Tier Limits
  FREE_TIER_LIMIT: 5, // 5 generations per month

  // API Models
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
  CLAUDE_MAX_TOKENS: 1024,

  // Auth State Keys
  AUTH_STORAGE_KEY: 'supabase_auth_session',
  USER_STORAGE_KEY: 'supabase_user',
  REFRESH_TOKEN_KEY: 'supabase_refresh_token',

  // Feature Flags
  FEATURES: {
    GOOGLE_AUTH: true,
    CANVAS_INTEGRATION: true,
    BYOK_FALLBACK: true,
    PROXY_FALLBACK: true,
  },

  // Error Messages
  ERRORS: {
    AUTH_FAILED: 'Authentication failed. Please try again.',
    NO_AUTH_SESSION: 'No active authentication session. Please sign in.',
    PROXY_UNAVAILABLE: 'Proxy server unavailable. Using alternative method.',
    API_ERROR: 'API call failed. Please check your connection and try again.',
    INVALID_SESSION: 'Your session has expired. Please sign in again.',
    STORAGE_ERROR: 'Failed to save authentication data.',
  },
};

// Object.freeze prevents accidental modifications
Object.freeze(STUDYBOT_CONFIG);

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = STUDYBOT_CONFIG;
}
