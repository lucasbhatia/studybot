/**
 * Canvas LMS API Client
 * Handles authentication and API calls to Canvas LMS
 * 
 * Supports:
 * - Token-based authentication
 * - Course listing
 * - Module and assignment retrieval
 * - Content extraction from Canvas
 * - OAuth setup (for future)
 */

class CanvasAPIClient {
  constructor() {
    this.baseUrl = null;
    this.apiToken = null;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initialize Canvas with URL and token
   */
  async initialize(canvasUrl, apiToken) {
    // Validate URL format
    if (!canvasUrl || !canvasUrl.includes('instructure.com')) {
      throw new Error('Invalid Canvas URL. Must be a Canvas instance URL (e.g., https://uk.instructure.com)');
    }

    // Remove trailing slash
    this.baseUrl = canvasUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
    this.headers['Authorization'] = `Bearer ${apiToken}`;

    // Test authentication
    const isValid = await this.testConnection();
    if (!isValid) {
      throw new Error('Invalid Canvas credentials');
    }

    return true;
  }

  /**
   * Get configuration from storage
   */
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['canvas_url', 'canvas_token'], (result) => {
        resolve({
          url: result.canvas_url || null,
          token: result.canvas_token || null,
        });
      });
    });
  }

  /**
   * Save configuration to storage
   */
  async saveConfig(url, token) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(
        {
          canvas_url: url,
          canvas_token: token,
        },
        () => resolve(true)
      );
    });
  }

  /**
   * Clear configuration from storage
   */
  async clearConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.remove(['canvas_url', 'canvas_token'], () => resolve(true));
    });
  }

  /**
   * Test Canvas API connection
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('/api/v1/users/self');
      return response && response.id;
    } catch (error) {
      console.error('Canvas connection test failed:', error);
      return false;
    }
  }

  /**
   * Make authenticated request to Canvas API
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.baseUrl || !this.apiToken) {
      throw new Error('Canvas not configured. Please provide URL and API token.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: this.headers,
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Canvas API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    return this.makeRequest('/api/v1/users/self');
  }

  /**
   * Get all courses for current user
   */
  async getCourses() {
    try {
      const courses = await this.makeRequest('/api/v1/courses?per_page=100&include=teachers,total_students');
      return courses.filter((c) => c.workflow_state === 'available');
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      throw error;
    }
  }

  /**
   * Get modules for a course
   */
  async getModules(courseId) {
    try {
      const modules = await this.makeRequest(`/api/v1/courses/${courseId}/modules?per_page=100`);
      return modules || [];
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      throw error;
    }
  }

  /**
   * Get module items (lessons, quizzes, etc.)
   */
  async getModuleItems(courseId, moduleId) {
    try {
      const items = await this.makeRequest(
        `/api/v1/courses/${courseId}/modules/${moduleId}/items?per_page=100&include=content_details`
      );
      return items || [];
    } catch (error) {
      console.error('Failed to fetch module items:', error);
      throw error;
    }
  }

  /**
   * Get assignments for a course
   */
  async getAssignments(courseId) {
    try {
      const assignments = await this.makeRequest(`/api/v1/courses/${courseId}/assignments?per_page=100`);
      return assignments || [];
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignment details (with description)
   */
  async getAssignment(courseId, assignmentId) {
    try {
      return this.makeRequest(`/api/v1/courses/${courseId}/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
      throw error;
    }
  }

  /**
   * Get course syllabus
   */
  async getCourseSyllabus(courseId) {
    try {
      const course = await this.makeRequest(`/api/v1/courses/${courseId}?include=syllabus_body`);
      return course.syllabus_body || '';
    } catch (error) {
      console.error('Failed to fetch syllabus:', error);
      throw error;
    }
  }

  /**
   * Get course description
   */
  async getCourseDescription(courseId) {
    try {
      const course = await this.makeRequest(`/api/v1/courses/${courseId}`);
      return {
        id: course.id,
        name: course.name,
        code: course.course_code,
        description: course.public_description || '',
        syllabus: course.syllabus_body || '',
      };
    } catch (error) {
      console.error('Failed to fetch course:', error);
      throw error;
    }
  }

  /**
   * Get files from a course folder
   */
  async getFiles(courseId, folderId = null) {
    try {
      let endpoint = `/api/v1/courses/${courseId}/files?per_page=100`;
      if (folderId) {
        endpoint = `/api/v1/folders/${folderId}/files?per_page=100`;
      }
      return this.makeRequest(endpoint);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      throw error;
    }
  }

  /**
   * Get announcements for a course
   */
  async getAnnouncements(courseId) {
    try {
      return this.makeRequest(`/api/v1/courses/${courseId}/announcements?per_page=100&sort=created_at&order=desc`);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      throw error;
    }
  }

  /**
   * Extract text content from assignment
   */
  async extractAssignmentContent(courseId, assignmentId) {
    try {
      const assignment = await this.getAssignment(courseId, assignmentId);

      // Strip HTML tags from description
      const description = assignment.description || '';
      const textContent = this.stripHtml(description);

      return {
        title: assignment.name,
        content: textContent,
        dueDate: assignment.due_at,
        instructions: description,
        pointsPossible: assignment.points_possible,
      };
    } catch (error) {
      console.error('Failed to extract assignment content:', error);
      throw error;
    }
  }

  /**
   * Extract page content from module item
   */
  async extractPageContent(courseId, pageUrl) {
    try {
      // Canvas pages are typically at /pages/page_id
      // We need to fetch the page HTML and extract text
      const response = await fetch(`${this.baseUrl}${pageUrl}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();
      const text = this.stripHtml(html);

      return text;
    } catch (error) {
      console.error('Failed to extract page content:', error);
      throw error;
    }
  }

  /**
   * Strip HTML tags from text
   */
  stripHtml(html) {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>.*?<\/style>/gi, '');

    // Remove HTML comments
    text = text.replace(/<!--.*?-->/g, '');

    // Decode HTML entities
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    text = textarea.value;

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Search for content in course
   */
  async searchCourse(courseId, query) {
    try {
      const [assignments, modules] = await Promise.all([
        this.getAssignments(courseId),
        this.getModules(courseId),
      ]);

      const matchingAssignments = assignments.filter(
        (a) =>
          a.name.toLowerCase().includes(query.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(query.toLowerCase()))
      );

      const matchingModules = modules.filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase())
      );

      return {
        assignments: matchingAssignments,
        modules: matchingModules,
      };
    } catch (error) {
      console.error('Failed to search course:', error);
      throw error;
    }
  }

  /**
   * Format course data for UI display
   */
  formatCourse(course) {
    return {
      id: course.id,
      name: course.name,
      code: course.course_code || '',
      term: course.term ? course.term.name : '',
      studentCount: course.total_students || 0,
      teachers: course.teachers ? course.teachers.map((t) => t.name).join(', ') : '',
    };
  }

  /**
   * Format module for UI
   */
  formatModule(module) {
    return {
      id: module.id,
      name: module.name,
      itemCount: module.items_count || 0,
      unlocked: module.unlock_at ? new Date(module.unlock_at) > new Date() : true,
    };
  }

  /**
   * Format assignment for UI
   */
  formatAssignment(assignment) {
    return {
      id: assignment.id,
      name: assignment.name,
      dueDate: assignment.due_at,
      pointsPossible: assignment.points_possible || 0,
      submissionTypes: assignment.submission_types || [],
      published: assignment.published,
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasAPIClient;
}
