/**
 * StudyBot Configuration
 * Central place for all app configuration and constants
 */

const STUDYBOT_CONFIG = {
  // Supabase Configuration
  // Note: In production, these should be set via environment variables or user configuration
  // For now, using a placeholder that will be configured during deployment
  SUPABASE_URL: '',  // Will be configured during deployment
  SUPABASE_ANON_KEY: '',  // Will be configured during deployment

  // API Endpoints
  PROXY_URL: 'https://api.studybot.dev/v1',

  // Extension Configuration
  VERSION: '1.0.0',
  EXTENSION_ID: chrome.runtime.id,

  // Auth Configuration
  AUTH_CALLBACK_URL: chrome.runtime.getURL('auth/callback.html'),
  CANVAS_AUTH_CALLBACK_URL: chrome.runtime.getURL('auth/canvas-callback.html'),

  // Canvas OAuth Configuration
  CANVAS_OAUTH: {
    // Canvas Developer Key (set by user during onboarding)
    CLIENT_ID: null,
    CLIENT_SECRET: null, // Only used server-side
    
    // Common university Canvas URLs (user can also enter custom)
    UNIVERSITY_URLS: {
      'University of Kansas': 'https://ku.instructure.com',
      'MIT': 'https://canvas.mit.edu',
      'Stanford': 'https://stanford.instructure.com',
      'UC Berkeley': 'https://bcourses.berkeley.edu',
      'University of Michigan': 'https://umich.instructure.com',
      'University of Illinois': 'https://courses.illinois.edu',
      'Georgia Tech': 'https://gatech.instructure.com',
      'Yale': 'https://yale.instructure.com',
      'Princeton': 'https://canvas.princeton.edu',
      'Harvard': 'https://canvas.harvard.edu',
      'Instructure Cloud': 'https://canvas.instructure.com',
      'UK': 'https://uk.instructure.com',
    },
    
    // OAuth scopes for Canvas
    SCOPES: 'url:GET|/api/v1/users/self url:GET|/api/v1/users/self/profile url:GET|/api/v1/courses url:GET|/api/v1/courses/:id/users',
  },

  // Free Tier Limits
  FREE_TIER_LIMIT: 5, // 5 generations per month

  // API Models
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
  CLAUDE_MAX_TOKENS: 1024,

  // Auth State Keys
  AUTH_STORAGE_KEY: 'supabase_auth_session',
  USER_STORAGE_KEY: 'supabase_user',
  REFRESH_TOKEN_KEY: 'supabase_refresh_token',
  CANVAS_AUTH_STORAGE_KEY: 'canvas_session',
  CANVAS_USER_STORAGE_KEY: 'canvas_user',

  // Feature Flags
  FEATURES: {
    GOOGLE_AUTH: true,
    CANVAS_AUTH: true,
    CANVAS_INTEGRATION: true,
    SOCIAL_FEATURES: true,
    BYOK_FALLBACK: true,
    PROXY_FALLBACK: true,
  },

  // Error Messages
  ERRORS: {
    AUTH_FAILED: 'Authentication failed. Please try again.',
    NO_AUTH_SESSION: 'No active authentication session. Please sign in.',
    CANVAS_AUTH_FAILED: 'Canvas authentication failed. Please check your credentials.',
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
