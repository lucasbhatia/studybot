/**
 * Supabase Authentication Service
 * Handles Google OAuth via Supabase with fallback to BYOK
 *
 * Flow:
 * 1. User clicks "Sign In with Google"
 * 2. Opens OAuth flow in new tab (redirects to auth/callback.html)
 * 3. Callback page extracts auth token and stores it locally
 * 4. Returns to extension with session stored
 * 5. All API calls include auth token in headers
 */

class AuthService {
  constructor(supabaseUrl = STUDYBOT_CONFIG.SUPABASE_URL, supabaseAnonKey = STUDYBOT_CONFIG.SUPABASE_ANON_KEY) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.session = null;
    this.user = null;
    this.authStateCallbacks = [];

    // Initialize session from storage
    this.initializeSession();
  }

  /**
   * Initialize session from chrome storage
   */
  async initializeSession() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(
          [STUDYBOT_CONFIG.AUTH_STORAGE_KEY, STUDYBOT_CONFIG.USER_STORAGE_KEY],
          resolve
        );
      });

      if (result[STUDYBOT_CONFIG.AUTH_STORAGE_KEY]) {
        this.session = result[STUDYBOT_CONFIG.AUTH_STORAGE_KEY];
        this.user = result[STUDYBOT_CONFIG.USER_STORAGE_KEY];

        // Check if session is expired and refresh if needed
        if (this.isSessionExpired()) {
          await this.refreshSession();
        }
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired() {
    if (!this.session || !this.session.expires_at) return true;
    const expiresAt = new Date(this.session.expires_at);
    const now = new Date();
    // Consider expired if within 5 minutes of expiry
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
  }

  /**
   * Sign in with Google via Supabase OAuth
   */
  async signInWithGoogle() {
    try {
      // Prepare the OAuth authorization URL
      const redirectUrl = STUDYBOT_CONFIG.AUTH_CALLBACK_URL;

      const authUrl = `${this.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
        redirectUrl
      )}&scopes=openid%20profile%20email`;

      // Open auth in new tab
      return new Promise((resolve) => {
        chrome.tabs.create({ url: authUrl }, (tab) => {
          // Listen for message from callback page
          const messageListener = (message, sender, sendResponse) => {
            if (message.type === 'AUTH_SUCCESS') {
              // Remove listener
              chrome.runtime.onMessage.removeListener(messageListener);
              resolve({ success: true, session: message.session, user: message.user });
            } else if (message.type === 'AUTH_ERROR') {
              chrome.runtime.onMessage.removeListener(messageListener);
              resolve({ success: false, error: message.error });
            }
          };

          chrome.runtime.onMessage.addListener(messageListener);

          // Timeout after 10 minutes
          setTimeout(() => {
            chrome.runtime.onMessage.removeListener(messageListener);
            resolve({ success: false, error: 'Authentication timeout' });
          }, 10 * 60 * 1000);
        });
      });
    } catch (error) {
      console.error('Sign in with Google failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle OAuth callback (called from auth/callback.html)
   * Extracts session from URL and saves to storage
   */
  async handleOAuthCallback(hash) {
    try {
      // Parse the hash from redirect
      // Format: #access_token=...&token_type=...&expires_in=...
      const params = new URLSearchParams(hash.substring(1));

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = parseInt(params.get('expires_in'), 10);
      const tokenType = params.get('token_type');

      if (!accessToken) {
        throw new Error('No access token in response');
      }

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Get user info from Supabase
      const user = await this.fetchUser(accessToken);

      if (!user) {
        throw new Error('Failed to fetch user info');
      }

      // Create session object
      const session = {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: tokenType,
        expires_at: expiresAt.toISOString(),
        expires_in: expiresIn,
        user,
      };

      // Save to chrome storage
      await this.saveSession(session, user);

      // Update local state
      this.session = session;
      this.user = user;

      // Notify listeners
      this.notifyAuthStateChange();

      return { success: true, session, user };
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch user info from Supabase using access token
   */
  async fetchUser(accessToken) {
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshSession() {
    try {
      if (!this.session || !this.session.refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.session.refresh_token,
        }),
      });

      if (!response.ok) {
        // If refresh fails, clear session
        await this.signOut();
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      // Update session
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);
      this.session = {
        ...this.session,
        access_token: data.access_token,
        refresh_token: data.refresh_token || this.session.refresh_token,
        expires_at: expiresAt.toISOString(),
        expires_in: data.expires_in,
      };

      // Save updated session
      await new Promise((resolve) => {
        chrome.storage.local.set({ [STUDYBOT_CONFIG.AUTH_STORAGE_KEY]: this.session }, resolve);
      });

      this.notifyAuthStateChange();
      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }

  /**
   * Save session to chrome storage
   */
  async saveSession(session, user) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          [STUDYBOT_CONFIG.AUTH_STORAGE_KEY]: session,
          [STUDYBOT_CONFIG.USER_STORAGE_KEY]: user,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(new Error(STUDYBOT_CONFIG.ERRORS.STORAGE_ERROR));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Get current session
   */
  async getSession() {
    // Check if session is expired and refresh if needed
    if (this.session && this.isSessionExpired()) {
      await this.refreshSession();
    }
    return this.session;
  }

  /**
   * Get current user
   */
  async getUser() {
    await this.getSession(); // Ensure session is valid
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.session !== null && this.session.access_token !== undefined;
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken() {
    const session = await this.getSession();
    return session ? session.access_token : null;
  }

  /**
   * Sign out user
   */
  async signOut() {
    try {
      // Call Supabase sign out (optional, for server-side logout)
      if (this.session && this.session.access_token) {
        await fetch(`${this.supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }).catch((e) => console.log('Server logout failed:', e)); // Non-critical
      }

      // Clear local storage
      await new Promise((resolve) => {
        chrome.storage.local.remove(
          [STUDYBOT_CONFIG.AUTH_STORAGE_KEY, STUDYBOT_CONFIG.USER_STORAGE_KEY],
          resolve
        );
      });

      // Clear session
      this.session = null;
      this.user = null;

      // Notify listeners
      this.notifyAuthStateChange();

      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback) {
    if (typeof callback === 'function') {
      this.authStateCallbacks.push(callback);
    }
  }

  /**
   * Notify all listeners of auth state change
   */
  notifyAuthStateChange() {
    this.authStateCallbacks.forEach((callback) => {
      try {
        callback(this.session, this.user);
      } catch (error) {
        console.error('Auth state change callback error:', error);
      }
    });
  }

  /**
   * Get user profile info for display
   */
  async getUserProfile() {
    const user = await this.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatar: user.user_metadata?.avatar_url,
      tier: 'free', // Default to free, server will set paid
      createdAt: user.created_at,
    };
  }
}

// Create global instance
const auth = new AuthService(STUDYBOT_CONFIG.SUPABASE_URL, STUDYBOT_CONFIG.SUPABASE_ANON_KEY);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
