// Chrome Storage Management
// Handles all persistence logic

class StorageManager {
  constructor() {
    this.KEYS = {
      STUDY_SETS: 'studybot_sets',
      SETTINGS: 'studybot_settings',
      STATS: 'studybot_stats',
    };
  }

  /**
   * Initialize default settings
   */
  async initializeSettings() {
    const existing = await this.getSetting('initialized');
    
    if (!existing) {
      const defaultSettings = {
        darkMode: true,
        aiDetailLevel: 'standard',
        notifications: true,
        initialized: true,
      };
      
      await chrome.storage.sync.set({
        [this.KEYS.SETTINGS]: defaultSettings,
      });
    }
  }

  /**
   * Check storage quota and warn if usage is high
   */
  async checkStorageQuota() {
    try {
      const items = await chrome.storage.local.get(null);
      const estimatedSize = JSON.stringify(items).length; // Rough estimate in bytes
      const quotaEstimate = 5 * 1024 * 1024; // Chrome local storage ~5MB
      const usagePercent = (estimatedSize / quotaEstimate) * 100;
      
      return {
        usedBytes: estimatedSize,
        quotaBytes: quotaEstimate,
        usagePercent: usagePercent,
        isNearLimit: usagePercent > 80,
        isFull: usagePercent > 95,
      };
    } catch (error) {
      console.error('Storage quota check failed:', error);
      return { usagePercent: 0, isNearLimit: false, isFull: false };
    }
  }

  /**
   * Save a new study set
   */
  async saveStudySet(set) {
    const sets = await this.getStudySets();
    
    // Check storage quota before saving
    const quotaStatus = await this.checkStorageQuota();
    if (quotaStatus.isFull) {
      throw new Error('Storage is full. Please delete some study sets to continue.');
    }
    if (quotaStatus.isNearLimit) {
      console.warn('Storage is 80% full. Consider deleting old study sets.');
    }
    
    const newSet = {
      id: this.generateId(),
      title: set.title || 'Untitled Set',
      sourceUrl: set.sourceUrl || '',
      content: set.content || '',
      summary: set.summary || {},
      flashcards: set.flashcards || [],
      quiz: set.quiz || [],
      createdAt: new Date().toISOString(),
      lastStudied: null,
      cardsStudied: 0,
      cardsCorrect: 0,
    };
    
    sets.push(newSet);
    await chrome.storage.local.set({
      [this.KEYS.STUDY_SETS]: sets,
    });
    
    return newSet;
  }

  /**
   * Get all study sets
   */
  async getStudySets() {
    const result = await chrome.storage.local.get([this.KEYS.STUDY_SETS]);
    return result[this.KEYS.STUDY_SETS] || [];
  }

  /**
   * Get a specific study set by ID
   */
  async getStudySet(id) {
    const sets = await this.getStudySets();
    return sets.find(set => set.id === id);
  }

  /**
   * Update a study set
   */
  async updateStudySet(id, updates) {
    const sets = await this.getStudySets();
    const index = sets.findIndex(set => set.id === id);
    
    if (index !== -1) {
      sets[index] = { ...sets[index], ...updates };
      await chrome.storage.local.set({
        [this.KEYS.STUDY_SETS]: sets,
      });
      return sets[index];
    }
    
    return null;
  }

  /**
   * Update a specific flashcard in a set
   */
  async updateFlashcard(setId, cardId, updates) {
    const set = await this.getStudySet(setId);
    if (!set) return null;
    
    const cardIndex = set.flashcards.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      set.flashcards[cardIndex] = { ...set.flashcards[cardIndex], ...updates };
      return await this.updateStudySet(setId, { flashcards: set.flashcards });
    }
    
    return null;
  }

  /**
   * Add a new flashcard to a set
   */
  async addFlashcard(setId, card) {
    const set = await this.getStudySet(setId);
    if (!set) return null;
    
    const newCard = {
      ...card,
      id: this.generateId(),
    };
    
    set.flashcards.push(newCard);
    return await this.updateStudySet(setId, { flashcards: set.flashcards });
  }

  /**
   * Delete a flashcard
   */
  async deleteFlashcard(setId, cardId) {
    const set = await this.getStudySet(setId);
    if (!set) return null;
    
    set.flashcards = set.flashcards.filter(card => card.id !== cardId);
    return await this.updateStudySet(setId, { flashcards: set.flashcards });
  }

  /**
   * Delete a study set
   */
  async deleteStudySet(id) {
    const sets = await this.getStudySets();
    const filtered = sets.filter(set => set.id !== id);
    
    await chrome.storage.local.set({
      [this.KEYS.STUDY_SETS]: filtered,
    });
    
    return true;
  }

  /**
   * Export study set as JSON
   */
  async exportStudySet(id) {
    const set = await this.getStudySet(id);
    if (!set) return null;
    
    const json = JSON.stringify(set, null, 2);
    return {
      filename: `${set.title}-${new Date().toISOString().slice(0, 10)}.json`,
      data: json,
    };
  }

  /**
   * Import study set from JSON
   */
  async importStudySet(jsonData) {
    try {
      const set = JSON.parse(jsonData);
      
      // Validate set structure
      if (!set.title || !set.flashcards) {
        throw new Error('Invalid study set format');
      }
      
      set.id = this.generateId();
      set.createdAt = new Date().toISOString();
      
      const sets = await this.getStudySets();
      sets.push(set);
      
      await chrome.storage.local.set({
        [this.KEYS.STUDY_SETS]: sets,
      });
      
      return set;
    } catch (error) {
      console.error('Import failed:', error);
      return null;
    }
  }

  /**
   * Get user settings
   */
  async getSettings() {
    const result = await chrome.storage.sync.get([this.KEYS.SETTINGS]);
    return result[this.KEYS.SETTINGS] || {
      darkMode: true,
      aiDetailLevel: 'standard',
      notifications: true,
    };
  }

  /**
   * Update a single setting
   */
  async updateSetting(key, value) {
    const settings = await this.getSettings();
    settings[key] = value;
    
    await chrome.storage.sync.set({
      [this.KEYS.SETTINGS]: settings,
    });
    
    return settings;
  }

  /**
   * Get setting value
   */
  async getSetting(key) {
    const settings = await this.getSettings();
    return settings[key];
  }

  /**
   * Get stats
   */
  async getStats() {
    const result = await chrome.storage.local.get([this.KEYS.STATS]);
    return result[this.KEYS.STATS] || {
      totalSets: 0,
      totalCards: 0,
      cardsStudied: 0,
      currentStreak: 0,
      lastStudyDate: null,
    };
  }

  /**
   * Update stats
   */
  async updateStats(updates) {
    const stats = await this.getStats();
    const newStats = { ...stats, ...updates };
    
    await chrome.storage.local.set({
      [this.KEYS.STATS]: newStats,
    });
    
    return newStats;
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    return true;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Search study sets by title or content
   */
  async searchStudySets(query) {
    const sets = await this.getStudySets();
    const lowerQuery = query.toLowerCase();
    
    return sets.filter(set =>
      set.title.toLowerCase().includes(lowerQuery) ||
      set.content.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
