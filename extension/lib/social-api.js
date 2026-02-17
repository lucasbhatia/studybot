/**
 * StudyBot Social API Service
 * Manages friends, study sets, class groups, and activity feed
 * 
 * Features:
 * - Friend requests and management
 * - Create and share study sets
 * - Auto-join class groups
 * - Activity feed from friends
 */

class SocialAPI {
  constructor(supabaseUrl, supabaseAnonKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.currentUser = null;
  }

  /**
   * Initialize with authenticated user
   */
  async initialize(user) {
    this.currentUser = user;
  }

  /**
   * Get access token for authenticated requests
   */
  async getAuthToken() {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get('supabase_auth_session', resolve);
    });
    return result.supabase_auth_session?.access_token;
  }

  /**
   * Make authenticated API request to Supabase
   */
  async request(path, options = {}) {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const url = `${this.supabaseUrl}/rest/v1${path}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'apikey': this.supabaseAnonKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message || response.status}`);
    }

    return await response.json();
  }

  // ========== FRIENDS ==========

  /**
   * Search for users by name or email
   */
  async searchUsers(query) {
    try {
      const results = await this.request(
        `/users?or=(display_name.ilike.%${query}%,email.ilike.%${query}%)`
      );
      return results.filter((user) => user.id !== this.currentUser.id);
    } catch (error) {
      console.error('Search users failed:', error);
      throw error;
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(friendId) {
    try {
      const result = await this.request('/friendships', {
        method: 'POST',
        body: JSON.stringify({
          user_id: this.currentUser.id,
          friend_id: friendId,
          status: 'pending',
        }),
      });
      return result[0];
    } catch (error) {
      console.error('Send friend request failed:', error);
      throw error;
    }
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(friendshipId) {
    try {
      const result = await this.request(
        `/friendships?id=eq.${friendshipId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          }),
        }
      );
      return result[0];
    } catch (error) {
      console.error('Accept friend request failed:', error);
      throw error;
    }
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(friendshipId) {
    try {
      await this.request(`/friendships?id=eq.${friendshipId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Decline friend request failed:', error);
      throw error;
    }
  }

  /**
   * Get accepted friends
   */
  async getFriends() {
    try {
      const result = await this.request(
        `/friendships?or=(user_id.eq.${this.currentUser.id},friend_id.eq.${this.currentUser.id})&status=eq.accepted&select=*,friend:friend_id(*),user:user_id(*)`
      );

      return result.map((friendship) => {
        return friendship.user_id === this.currentUser.id 
          ? friendship.friend 
          : friendship.user;
      });
    } catch (error) {
      console.error('Get friends failed:', error);
      throw error;
    }
  }

  /**
   * Get pending friend requests
   */
  async getFriendRequests() {
    try {
      const result = await this.request(
        `/friendships?friend_id=eq.${this.currentUser.id}&status=eq.pending&select=*,user:user_id(*)`
      );
      return result;
    } catch (error) {
      console.error('Get friend requests failed:', error);
      throw error;
    }
  }

  // ========== STUDY SETS ==========

  /**
   * Create a new study set
   */
  async createStudySet(title, content, courseId, courseCode, isPublic = false) {
    try {
      // Generate share code
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const result = await this.request('/study_sets', {
        method: 'POST',
        body: JSON.stringify({
          creator_id: this.currentUser.id,
          title: title,
          content: content,
          course_id: courseId,
          course_name: courseCode,
          content_type: content.type || 'mixed',
          is_public: isPublic,
          share_code: shareCode,
        }),
      });

      return result[0];
    } catch (error) {
      console.error('Create study set failed:', error);
      throw error;
    }
  }

  /**
   * Get user's own study sets
   */
  async getMyStudySets() {
    try {
      const result = await this.request(
        `/study_sets?creator_id=eq.${this.currentUser.id}&order=created_at.desc`
      );
      return result;
    } catch (error) {
      console.error('Get my study sets failed:', error);
      throw error;
    }
  }

  /**
   * Get study sets shared with user
   */
  async getSharedWithMe() {
    try {
      const result = await this.request(
        `/shared_study_sets?shared_with_id=eq.${this.currentUser.id}&select=*,study_set:study_set_id(*),shared_by:shared_by_id(*)&order=shared_at.desc`
      );

      return result.map((share) => ({
        ...share.study_set,
        shared_by: share.shared_by,
        shared_at: share.shared_at,
      }));
    } catch (error) {
      console.error('Get shared study sets failed:', error);
      throw error;
    }
  }

  /**
   * Share study set with specific users
   */
  async shareStudySet(setId, userIds) {
    try {
      const shares = userIds.map((userId) => ({
        study_set_id: setId,
        shared_by_id: this.currentUser.id,
        shared_with_id: userId,
      }));

      const result = await this.request('/shared_study_sets', {
        method: 'POST',
        body: JSON.stringify(shares),
      });

      return result;
    } catch (error) {
      console.error('Share study set failed:', error);
      throw error;
    }
  }

  /**
   * Get study set by share code
   */
  async getStudySetByShareCode(code) {
    try {
      const result = await this.request(
        `/study_sets?share_code=eq.${code}&select=*,creator:creator_id(*)`
      );

      if (result.length === 0) {
        throw new Error('Study set not found');
      }

      return result[0];
    } catch (error) {
      console.error('Get study set by share code failed:', error);
      throw error;
    }
  }

  /**
   * Update study set
   */
  async updateStudySet(setId, updates) {
    try {
      const result = await this.request(
        `/study_sets?id=eq.${setId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            ...updates,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      return result[0];
    } catch (error) {
      console.error('Update study set failed:', error);
      throw error;
    }
  }

  /**
   * Delete study set
   */
  async deleteStudySet(setId) {
    try {
      await this.request(`/study_sets?id=eq.${setId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Delete study set failed:', error);
      throw error;
    }
  }

  /**
   * Like study set
   */
  async likeStudySet(setId) {
    try {
      await this.request('/study_set_likes', {
        method: 'POST',
        body: JSON.stringify({
          study_set_id: setId,
          user_id: this.currentUser.id,
        }),
      });

      // Update like count
      await this.request(
        `/study_sets?id=eq.${setId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            like_count: '(SELECT COUNT(*) FROM study_set_likes WHERE study_set_id = ' + setId + ')',
          }),
        }
      );

      return true;
    } catch (error) {
      console.error('Like study set failed:', error);
      throw error;
    }
  }

  /**
   * Unlike study set
   */
  async unlikeStudySet(setId) {
    try {
      await this.request(
        `/study_set_likes?study_set_id=eq.${setId}&user_id=eq.${this.currentUser.id}`,
        {
          method: 'DELETE',
        }
      );
      return true;
    } catch (error) {
      console.error('Unlike study set failed:', error);
      throw error;
    }
  }

  // ========== CLASS GROUPS ==========

  /**
   * Join or create class group
   */
  async joinClassGroup(canvasCourseId, courseName, courseCode, canvasUrl) {
    try {
      // Check if group exists
      let group = await this.request(
        `/class_groups?canvas_course_id=eq.${canvasCourseId}&canvas_url=eq.${encodeURIComponent(canvasUrl)}`
      );

      // Create if doesn't exist
      if (group.length === 0) {
        const created = await this.request('/class_groups', {
          method: 'POST',
          body: JSON.stringify({
            canvas_course_id: canvasCourseId,
            canvas_url: canvasUrl,
            course_name: courseName,
            course_code: courseCode,
          }),
        });
        group = created;
      } else {
        group = group;
      }

      // Add user to group
      await this.request('/class_group_members', {
        method: 'POST',
        body: JSON.stringify({
          group_id: group[0].id,
          user_id: this.currentUser.id,
        }),
      });

      return group[0];
    } catch (error) {
      console.error('Join class group failed:', error);
      throw error;
    }
  }

  /**
   * Get user's class groups
   */
  async getMyClassGroups() {
    try {
      const result = await this.request(
        `/class_group_members?user_id=eq.${this.currentUser.id}&select=*,group:group_id(*)&order=joined_at.desc`
      );

      return result.map((member) => member.group);
    } catch (error) {
      console.error('Get my class groups failed:', error);
      throw error;
    }
  }

  /**
   * Get study sets for a class group
   */
  async getClassGroupSets(groupId) {
    try {
      const group = await this.request(`/class_groups?id=eq.${groupId}`);
      if (group.length === 0) {
        throw new Error('Group not found');
      }

      const canvasCourseId = group[0].canvas_course_id;

      // Get study sets for this course
      const result = await this.request(
        `/study_sets?course_id=eq.${canvasCourseId}&select=*,creator:creator_id(*)`
      );

      return result;
    } catch (error) {
      console.error('Get class group sets failed:', error);
      throw error;
    }
  }

  /**
   * Get members of a class group
   */
  async getClassGroupMembers(groupId) {
    try {
      const result = await this.request(
        `/class_group_members?group_id=eq.${groupId}&select=*,user:user_id(*)`
      );

      return result.map((member) => member.user);
    } catch (error) {
      console.error('Get class group members failed:', error);
      throw error;
    }
  }

  // ========== ACTIVITY FEED ==========

  /**
   * Get activity feed from friends
   */
  async getFeed(limit = 50) {
    try {
      // Get accepted friends
      const friendships = await this.request(
        `/friendships?or=(user_id.eq.${this.currentUser.id},friend_id.eq.${this.currentUser.id})&status=eq.accepted`
      );

      const friendIds = friendships.map((f) =>
        f.user_id === this.currentUser.id ? f.friend_id : f.user_id
      );

      if (friendIds.length === 0) {
        return [];
      }

      // Get activities from friends
      const result = await this.request(
        `/activities?user_id=in.(${friendIds.join(',')})&order=created_at.desc&limit=${limit}&select=*,user:user_id(*)`
      );

      return result;
    } catch (error) {
      console.error('Get activity feed failed:', error);
      throw error;
    }
  }

  /**
   * Create activity log entry
   */
  async logActivity(activityType, targetId, metadata = {}) {
    try {
      const result = await this.request('/activities', {
        method: 'POST',
        body: JSON.stringify({
          user_id: this.currentUser.id,
          activity_type: activityType,
          target_id: targetId,
          metadata: metadata,
        }),
      });

      return result[0];
    } catch (error) {
      console.error('Log activity failed:', error);
      throw error;
    }
  }

  /**
   * Sync user profile to Supabase after Canvas login
   */
  async syncUserProfile(canvasUser, canvasUrl) {
    try {
      // Check if user exists
      const existing = await this.request(
        `/users?canvas_user_id=eq.${canvasUser.canvas_user_id}`
      );

      if (existing.length > 0) {
        // Update existing
        const result = await this.request(
          `/users?id=eq.${existing[0].id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({
              last_active: new Date().toISOString(),
            }),
          }
        );
        return result[0];
      }

      // Create new user
      const result = await this.request('/users', {
        method: 'POST',
        body: JSON.stringify({
          canvas_user_id: canvasUser.canvas_user_id,
          canvas_url: canvasUrl,
          display_name: canvasUser.name,
          email: canvasUser.email,
          avatar_url: canvasUser.avatar_url,
          first_name: canvasUser.name?.split(' ')[0],
          last_name: canvasUser.name?.split(' ').slice(1).join(' '),
        }),
      });

      return result[0];
    } catch (error) {
      console.error('Sync user profile failed:', error);
      throw error;
    }
  }
}

// Create global instance (initialize later with Supabase credentials)
let socialAPI = null;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocialAPI;
}
