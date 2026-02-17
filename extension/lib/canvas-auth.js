/**
 * Canvas OAuth Authentication Service
 * Handles OAuth flow with university Canvas LMS instances
 *
 * Flow:
 * 1. User selects their university or enters Canvas URL
 * 2. Clicks "Sign in with Canvas" → Opens OAuth flow
 * 3. User logs into their university Canvas
 * 4. Redirected back with authorization code
 * 5. Exchange code for access token
 * 6. Fetch user profile and courses
 * 7. Create session and sync to Supabase
 */

class CanvasAuth {
  constructor() {
    this.session = null;
    this.user = null;
    this.canvasUrl = null;
    this.clientId = null;
    this.authStateCallbacks = [];

    // Initialize from storage
    this.initializeSession();
  }

  /**
   * Initialize session from chrome storage
   */
  async initializeSession() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(
          ['canvas_session', 'canvas_user', 'canvas_url'],
          resolve
        );
      });

      if (result.canvas_session) {
        this.session = result.canvas_session;
        this.user = result.canvas_user;
        this.canvasUrl = result.canvas_url;

        // Validate token is still valid
        if (this.isTokenExpired()) {
          await this.refreshToken();
        }
      }
    } catch (error) {
      console.error('Failed to initialize Canvas session:', error);
    }
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired() {
    if (!this.session || !this.session.expires_at) return true;
    const expiresAt = new Date(this.session.expires_at);
    const now = new Date();
    // Consider expired if within 5 minutes of expiry
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
  }

  /**
   * Start Canvas OAuth sign-in flow
   * @param {string} canvasUrl - The Canvas instance URL (e.g., https://uk.instructure.com)
   * @param {string} clientId - The Canvas Developer Key / Client ID
   */
  async signIn(canvasUrl, clientId) {
    try {
      // Validate inputs
      if (!canvasUrl || !clientId) {
        throw new Error('Canvas URL and Client ID are required');
      }

      // Normalize Canvas URL
      if (!canvasUrl.startsWith('http')) {
        canvasUrl = 'https://' + canvasUrl;
      }
      if (canvasUrl.endsWith('/')) {
        canvasUrl = canvasUrl.slice(0, -1);
      }

      this.canvasUrl = canvasUrl;
      this.clientId = clientId;

      // Build OAuth authorization URL
      const redirectUrl = chrome.runtime.getURL('auth/canvas-callback.html');
      const scopes = 'url:GET|/api/v1/users/self url:GET|/api/v1/users/self/profile url:GET|/api/v1/courses';

      const authUrl = new URL(`${canvasUrl}/login/oauth2/auth`);
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', redirectUrl);
      authUrl.searchParams.append('scopes', scopes);
      authUrl.searchParams.append('purpose', 'StudyBot');

      // Open auth in new tab
      return new Promise((resolve) => {
        chrome.tabs.create({ url: authUrl.toString() }, (tab) => {
          const messageListener = (message, sender, sendResponse) => {
            if (message.type === 'CANVAS_AUTH_SUCCESS') {
              chrome.runtime.onMessage.removeListener(messageListener);
              resolve({ success: true, session: message.session, user: message.user });
            } else if (message.type === 'CANVAS_AUTH_ERROR') {
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
      console.error('Canvas sign in failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle OAuth callback from Canvas
   * Exchanges authorization code for access token
   * @param {string} code - Authorization code from Canvas
   * @param {string} canvasUrl - Canvas instance URL
   * @param {string} clientId - Client ID
   * @param {string} clientSecret - Client secret (server-side only)
   */
  async handleCallback(code, canvasUrl, clientId, clientSecret = null) {
    try {
      if (!code || !canvasUrl || !clientId) {
        throw new Error('Missing required parameters for token exchange');
      }

      const redirectUrl = chrome.runtime.getURL('auth/canvas-callback.html');

      // Exchange code for access token
      const tokenResponse = await fetch(`${canvasUrl}/login/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret, // If provided
          code: code,
          redirect_uri: redirectUrl,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(`Token exchange failed: ${error.error || tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error('No access token in response');
      }

      // Fetch user profile
      const user = await this.fetchUserProfile(canvasUrl, tokenData.access_token);
      if (!user) {
        throw new Error('Failed to fetch user profile');
      }

      // Create session object
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const session = {
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };

      // Save to chrome storage
      await this.saveSession(session, user, canvasUrl);

      // Update local state
      this.session = session;
      this.user = user;
      this.canvasUrl = canvasUrl;

      // Notify listeners
      this.notifyAuthStateChange();

      return { success: true, session, user };
    } catch (error) {
      console.error('Canvas OAuth callback handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch user profile from Canvas API
   */
  async fetchUserProfile(canvasUrl, accessToken) {
    try {
      const response = await fetch(`${canvasUrl}/api/v1/users/self/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const profile = await response.json();

      return {
        id: profile.id,
        name: profile.name,
        email: profile.primary_email,
        avatar_url: profile.avatar_url,
        canvas_user_id: profile.id,
        canvas_url: canvasUrl,
        primary_email: profile.primary_email,
        login_id: profile.login_id,
      };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  /**
   * Fetch user's courses from Canvas
   */
  async fetchCourses(canvasUrl = this.canvasUrl, accessToken = this.session?.access_token) {
    try {
      if (!canvasUrl || !accessToken) {
        throw new Error('Canvas URL and access token required');
      }

      const response = await fetch(
        `${canvasUrl}/api/v1/courses?enrollment_state=active&include=term&per_page=100`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const courses = await response.json();

      return courses.map((course) => ({
        id: course.id,
        name: course.name,
        code: course.course_code,
        canvas_id: course.id,
        term: course.term?.name,
        start_at: course.start_at,
        end_at: course.end_at,
      }));
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw error;
    }
  }

  /**
   * Refresh access token (if Canvas supports it)
   * Note: Canvas OAuth tokens don't typically expire, but include for completeness
   */
  async refreshToken() {
    try {
      if (!this.session || !this.session.access_token) {
        throw new Error('No session to refresh');
      }

      // Canvas tokens are long-lived and don't need refresh
      // This is a placeholder for future extensibility
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  /**
   * Save session to chrome storage
   */
  async saveSession(session, user, canvasUrl) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(
        {
          canvas_session: session,
          canvas_user: user,
          canvas_url: canvasUrl,
        },
        () => {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to save Canvas session'));
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
    if (this.session && this.isTokenExpired()) {
      await this.refreshToken();
    }
    return this.session;
  }

  /**
   * Get current user
   */
  async getUser() {
    await this.getSession();
    return this.user;
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken() {
    const session = await this.getSession();
    return session ? session.access_token : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.session !== null && this.session.access_token !== undefined;
  }

  /**
   * Get Canvas URL
   */
  getCanvasUrl() {
    return this.canvasUrl;
  }

  /**
   * Sign out user
   */
  async signOut() {
    try {
      // Clear local storage
      await new Promise((resolve) => {
        chrome.storage.local.remove(['canvas_session', 'canvas_user', 'canvas_url'], resolve);
      });

      // Clear session
      this.session = null;
      this.user = null;
      this.canvasUrl = null;

      // Notify listeners
      this.notifyAuthStateChange();

      return { success: true };
    } catch (error) {
      console.error('Canvas sign out failed:', error);
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
      id: user.canvas_user_id,
      email: user.email,
      name: user.name,
      avatar: user.avatar_url,
      canvas_url: this.canvasUrl,
    };
  }
}

// Create global instance
const canvasAuth = new CanvasAuth();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasAuth;
}
