// Content Script - Extracts content from webpages

class ContentExtractor {
  constructor() {
    this.floatingButton = null;
    this.init();
  }

  init() {
    this.injectFloatingButton();
    this.setupMessageListeners();
  }

  /**
   * Inject floating extraction button on the page
   */
  injectFloatingButton() {
    // Don't inject on extension pages
    if (window.location.protocol === 'chrome-extension:') return;

    const button = document.createElement('div');
    button.id = 'studybot-extract-button';
    button.setAttribute('class', 'studybot-floating-btn');
    button.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
      </svg>
      <span>StudyBot</span>
    `;
    button.title = 'Extract content with StudyBot';

    button.addEventListener('click', () => {
      this.extractPageContent();
    });

    document.body.appendChild(button);
    this.floatingButton = button;
  }

  /**
   * Extract main content from the page
   */
  extractPageContent() {
    const content = this.getMainContent();
    
    if (!content || content.trim().length === 0) {
      this.showNotification('No suitable content found on this page', 'error');
      return;
    }

    // Send to background/popup
    chrome.runtime.sendMessage({
      action: 'extractedContent',
      content: content,
      url: window.location.href,
      title: document.title,
    }, (response) => {
      if (response && response.success) {
        this.showNotification('Content extracted! Check the side panel.', 'success');
        // Open side panel
        chrome.runtime.sendMessage({ action: 'openSidePanel' });
      }
    });
  }

  /**
   * Extract main content using heuristics
   */
  getMainContent() {
    // Clone the document to avoid modifying original
    const clone = document.documentElement.cloneNode(true);

    // Remove scripts and styles
    clone.querySelectorAll('script, style, nav, .sidebar, .ad, .advertisement').forEach(el => {
      el.remove();
    });

    // Prefer article tag
    let mainContent = clone.querySelector('article');

    // Fall back to main tag
    if (!mainContent) {
      mainContent = clone.querySelector('main');
    }

    // Fall back to content div
    if (!mainContent) {
      mainContent = clone.querySelector('[role="main"]');
    }

    // Fall back to body
    if (!mainContent) {
      mainContent = clone.body;
    }

    // Extract text
    const text = this.extractTextFromElement(mainContent);

    return text;
  }

  /**
   * Extract clean text from element
   */
  extractTextFromElement(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let text = '';
    let node;

    while (node = walker.nextNode()) {
      const content = node.textContent.trim();
      if (content.length > 0) {
        text += content + '\n';
      }
    }

    return text.trim();
  }

  /**
   * Detect if this is a Canvas LMS page
   */
  isCanvasPage() {
    return /canvas\./.test(window.location.hostname) ||
           document.querySelector('[data-testid*="canvas"]') !== null;
  }

  /**
   * Extract Canvas-specific content
   */
  extractCanvasContent() {
    // Extract from Canvas module/assignment content
    let content = '';

    // Try to get the main content area
    const mainArea = document.querySelector('[role="main"]') ||
                    document.querySelector('.canvas-content') ||
                    document.querySelector('.content');

    if (mainArea) {
      content = this.extractTextFromElement(mainArea);
    }

    // Also try to get assignment description
    const assignmentDesc = document.querySelector('.assignment-description') ||
                          document.querySelector('[data-testid="assignment-description"]');

    if (assignmentDesc) {
      content += '\n\n' + this.extractTextFromElement(assignmentDesc);
    }

    return content;
  }

  /**
   * Setup message listener for background/popup
   */
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'extractSelectedText') {
        // Handle selected text extraction (from context menu)
        const text = request.text || window.getSelection().toString();

        if (text) {
          chrome.runtime.sendMessage({
            action: 'extractedContent',
            content: text,
            url: window.location.href,
            title: document.title,
            isSelection: true,
          });

          this.showNotification('Selected text captured!', 'success');
          chrome.runtime.sendMessage({ action: 'openSidePanel' });
        }

        sendResponse({ success: true });
      } else if (request.action === 'getPageInfo') {
        sendResponse({
          url: window.location.href,
          title: document.title,
          isCanvas: this.isCanvasPage(),
        });
      }
    });
  }

  /**
   * Show notification toast
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `studybot-notification studybot-notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize content extractor
const extractor = new ContentExtractor();
