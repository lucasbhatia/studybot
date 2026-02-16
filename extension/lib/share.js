// Sharing utilities for StudyBot

class ShareManager {
  /**
   * Generate a shareable link (encode set as URL parameter for MVP)
   */
  static generateShareLink(studySet) {
    // For MVP, we'll encode the set data in the URL
    // In production, this would store on a backend and generate a short link
    
    const encoded = btoa(JSON.stringify(studySet));
    const shareUrl = `studybot://import/${encoded}`;
    
    return {
      url: shareUrl,
      isShareable: true,
    };
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Generate share message
   */
  static generateShareMessage(studySet) {
    return `Check out my study set "${studySet.title}" on StudyBot! ${studySet.flashcards.length} cards ready to learn.`;
  }

  /**
   * Create export data URL for download
   */
  static createDownloadUrl(data, filename) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    return {
      url,
      filename,
    };
  }

  /**
   * Decode shared link
   */
  static decodeShareLink(encodedData) {
    try {
      const decoded = atob(encodedData);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode share link:', error);
      return null;
    }
  }

  /**
   * Trigger download
   */
  static triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShareManager;
}
