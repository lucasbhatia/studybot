/**
 * Canvas Token Authentication Service
 * Uses personal access tokens instead of OAuth
 * Students can generate tokens themselves from Canvas settings
 *
 * Flow:
 * 1. User enters Canvas URL (with auto-detect or dropdown)
 * 2. User generates token from Canvas → Account Settings → Approved Integrations
 * 3. User pastes token into extension
 * 4. Extension validates token by calling GET /api/v1/users/self
 * 5. Token + URL stored in chrome.storage.local
 * 6. Token used for all subsequent Canvas API calls
 */

class CanvasTokenService {
  constructor() {
    this.token = null;
    this.canvasUrl = null;
    this.profile = null;
    this.authStateCallbacks = [];

    // Initialize from storage
    this.initializeFromStorage();
  }

  /**
   * Initialize from chrome storage
   */
  async initializeFromStorage() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(
          ['canvas_token', 'canvas_url', 'canvas_profile'],
          resolve
        );
      });

      if (result.canvas_token && result.canvas_url) {
        this.token = result.canvas_token;
        this.canvasUrl = result.canvas_url;
        this.profile = result.canvas_profile;
      }
    } catch (error) {
      console.error('Failed to initialize Canvas token session:', error);
    }
  }

  /**
   * Connect to Canvas with token
   * @param {string} canvasUrl - Canvas instance URL (e.g., https://uk.instructure.com)
   * @param {string} token - Canvas personal access token
   * @returns {Promise<{success: boolean, profile?: object, error?: string}>}
   */
  async connect(canvasUrl, token) {
    try {
      if (!canvasUrl || !token) {
        throw new Error('Canvas URL and token are required');
      }

      // Normalize Canvas URL
      if (!canvasUrl.startsWith('http')) {
        canvasUrl = 'https://' + canvasUrl;
      }
      if (canvasUrl.endsWith('/')) {
        canvasUrl = canvasUrl.slice(0, -1);
      }

      // Validate token by fetching user profile
      const profile = await this.fetchProfile(canvasUrl, token);
      if (!profile) {
        throw new Error('Invalid token or Canvas URL');
      }

      // Save to storage
      await new Promise((resolve, reject) => {
        chrome.storage.local.set(
          {
            canvas_token: token,
            canvas_url: canvasUrl,
            canvas_profile: profile,
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(new Error('Failed to save Canvas token'));
            } else {
              resolve();
            }
          }
        );
      });

      // Update local state
      this.token = token;
      this.canvasUrl = canvasUrl;
      this.profile = profile;

      // Notify listeners
      this.notifyAuthStateChange();

      return {
        success: true,
        profile,
      };
    } catch (error) {
      console.error('Canvas token connection failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch user profile from Canvas API
   * @param {string} canvasUrl - Canvas URL
   * @param {string} token - Access token
   */
  async fetchProfile(canvasUrl, token) {
    try {
      const response = await fetch(`${canvasUrl}/api/v1/users/self/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Token is invalid or expired');
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        email: data.primary_email,
        login_id: data.login_id,
        avatar_url: data.avatar_url,
        canvas_user_id: data.id,
        canvas_url: canvasUrl,
      };
    } catch (error) {
      console.error('Failed to fetch Canvas profile:', error);
      throw error;
    }
  }

  /**
   * Fetch user's active courses
   * @returns {Promise<Array>}
   */
  async getCourses() {
    if (!this.isConnected()) {
      throw new Error('Not connected to Canvas');
    }

    try {
      const response = await fetch(
        `${this.canvasUrl}/api/v1/courses?enrollment_state=active&include=term&per_page=100`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
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
      console.error('Failed to fetch Canvas courses:', error);
      throw error;
    }
  }

  /**
   * Fetch assignments for a course
   */
  async getAssignments(courseId) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Canvas');
    }

    try {
      const response = await fetch(
        `${this.canvasUrl}/api/v1/courses/${courseId}/assignments?per_page=50`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch assignments: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Canvas assignments:', error);
      throw error;
    }
  }

  /**
   * Fetch modules for a course
   */
  async getModules(courseId) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Canvas');
    }

    try {
      const response = await fetch(
        `${this.canvasUrl}/api/v1/courses/${courseId}/modules?per_page=50`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Canvas modules:', error);
      throw error;
    }
  }

  /**
   * Fetch syllabus for a course
   */
  async getSyllabus(courseId) {
    if (!this.isConnected()) {
      throw new Error('Not connected to Canvas');
    }

    try {
      const response = await fetch(
        `${this.canvasUrl}/api/v1/courses/${courseId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.status}`);
      }

      const course = await response.json();
      return course.syllabus_body || 'No syllabus available';
    } catch (error) {
      console.error('Failed to fetch Canvas syllabus:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Canvas
   */
  async disconnect() {
    try {
      await new Promise((resolve) => {
        chrome.storage.local.remove(
          ['canvas_token', 'canvas_url', 'canvas_profile'],
          resolve
        );
      });

      this.token = null;
      this.canvasUrl = null;
      this.profile = null;

      // Notify listeners
      this.notifyAuthStateChange();

      return { success: true };
    } catch (error) {
      console.error('Failed to disconnect Canvas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get stored token (don't expose in regular usage)
   */
  getToken() {
    return this.token;
  }

  /**
   * Get Canvas URL
   */
  getCanvasUrl() {
    return this.canvasUrl;
  }

  /**
   * Get user profile
   */
  getProfile() {
    return this.profile;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.token !== null && this.canvasUrl !== null;
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
   * Notify listeners of auth state change
   */
  notifyAuthStateChange() {
    this.authStateCallbacks.forEach((callback) => {
      try {
        callback(this.isConnected(), this.profile);
      } catch (error) {
        console.error('Auth state change callback error:', error);
      }
    });
  }
}

// Create global instance
const canvasToken = new CanvasTokenService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasTokenService;
}
