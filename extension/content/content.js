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
    // Don't inject on extension pages or auth iframes
    if (window.location.protocol === 'chrome-extension:') return;
    if (window.location.href.includes('duosecurity.com')) return;
    if (window !== window.top) return; // Skip iframes

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

    if (document.body) {
      document.body.appendChild(button);
      this.floatingButton = button;
    } else {
      // Wait for DOM to be ready
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          document.body.appendChild(button);
          this.floatingButton = button;
        }
      });
    }
  }

  /**
   * Extract main content from the page
   */
  extractPageContent() {
    this.showNotification('Extracting content...', 'info');
    this.floatingButton.style.opacity = '0.5';
    this.floatingButton.style.pointerEvents = 'none';

    try {
      let content = this.getMainContent();
      
      if (!content || content.trim().length === 0) {
        this.showNotification('No suitable content found on this page', 'error');
        this.floatingButton.style.opacity = '1';
        this.floatingButton.style.pointerEvents = 'auto';
        return;
      }

      // Truncate very long content with notice
      const MAX_CONTENT_LENGTH = 50000;
      let wasTruncated = false;
      if (content.length > MAX_CONTENT_LENGTH) {
        content = content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated - exceeded 50KB limit]';
        wasTruncated = true;
      }

      // Send to background/popup with try-catch for invalidated context
      try {
        chrome.runtime.sendMessage({
          action: 'extractedContent',
          content: content,
          url: window.location.href,
          title: document.title,
          wasTruncated: wasTruncated,
        }, (response) => {
          this.floatingButton.style.opacity = '1';
          this.floatingButton.style.pointerEvents = 'auto';

          if (chrome.runtime.lastError) {
            // Side panel may not be open yet — that's okay, open it and it will re-extract
            this.showNotification('Opening study panel...', 'info');
            try {
              chrome.runtime.sendMessage({ action: 'openSidePanel' });
            } catch (e) {
              console.warn('Failed to send openSidePanel message (context invalidated)', e);
            }
            return;
          }

          if (response && response.received) {
            this.showNotification('Content extracted! Generating study materials...', 'success');
          } else {
            this.showNotification('Content captured — open the side panel to generate', 'info');
          }
        });
      } catch (e) {
        console.warn('Extension context invalidated, failing silently:', e);
        this.floatingButton.style.opacity = '1';
        this.floatingButton.style.pointerEvents = 'auto';
        // Don't show error to user - extension was likely reloaded
      }
    } catch (error) {
      console.error('Extraction error:', error);
      this.showNotification('Error extracting content: ' + error.message, 'error');
      this.floatingButton.style.opacity = '1';
      this.floatingButton.style.pointerEvents = 'auto';
    }
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
      mainContent = clone.body || clone.querySelector('body');
    }

    // Guard against null element
    if (!mainContent) {
      return document.body ? document.body.innerText : '';
    }

    // Extract text
    const text = this.extractTextFromElement(mainContent);

    return text;
  }

  /**
   * Extract clean text from element with structure preservation
   */
  extractTextFromElement(element) {
    if (!element) return '';
    let text = '';
    const visitedNodes = new Set();

    const walk = (node) => {
      if (!node || visitedNodes.has(node)) return;
      visitedNodes.add(node);

      // Skip certain elements
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        
        // Skip navigation, ads, sidebars
        if (['script', 'style', 'nav', 'noscript'].includes(tag)) return;
        if (node.classList.contains('ad') || node.classList.contains('advertisement') || 
            node.classList.contains('sidebar') || node.classList.contains('widget')) {
          return;
        }

        // Add heading with formatting
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
          text += '\n\n' + node.textContent.trim() + '\n';
          return; // Don't process children, already got text
        }

        // Handle lists
        if (tag === 'ul' || tag === 'ol') {
          text += '\n';
          Array.from(node.children).forEach((li) => {
            if (li.tagName.toLowerCase() === 'li') {
              text += '• ' + li.textContent.trim() + '\n';
            }
          });
          text += '\n';
          return;
        }

        // Handle tables
        if (tag === 'table') {
          text += '\n[Table]\n';
          Array.from(node.querySelectorAll('tr')).forEach((row) => {
            const cells = Array.from(row.querySelectorAll('td, th'))
              .map(cell => cell.textContent.trim())
              .join(' | ');
            if (cells) text += cells + '\n';
          });
          text += '\n';
          return;
        }

        // Handle code blocks
        if (tag === 'code' || tag === 'pre') {
          text += '\n[Code]\n' + node.textContent + '\n\n';
          return;
        }

        // Handle blockquotes
        if (tag === 'blockquote') {
          text += '\n> ' + node.textContent.trim() + '\n\n';
          return;
        }

        // Handle paragraphs and divs
        if (tag === 'p' || tag === 'div') {
          const content = node.textContent.trim();
          if (content.length > 0 && content.length < 5000) {
            text += content + '\n\n';
          }
          return;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const content = node.textContent.trim();
        if (content.length > 0 && content.length < 1000) {
          text += content + ' ';
        }
      }

      // Recurse to children
      Array.from(node.childNodes).forEach(walk);
    };

    walk(element);
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
          try {
            chrome.runtime.sendMessage({
              action: 'extractedContent',
              content: text,
              url: window.location.href,
              title: document.title,
              isSelection: true,
            });

            this.showNotification('Selected text captured!', 'success');
            try {
              chrome.runtime.sendMessage({ action: 'openSidePanel' });
            } catch (e) {
              console.warn('Failed to send openSidePanel message (context invalidated)', e);
            }
          } catch (e) {
            console.warn('Failed to send extractedContent message (context invalidated)', e);
          }
        }

        sendResponse({ success: true });
      } else if (request.action === 'getPageInfo') {
        sendResponse({
          url: window.location.href,
          title: document.title,
          isCanvas: this.isCanvasPage(),
        });
      } else if (request.action === 'captureContent') {
        this.extractPageContent();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  /**
   * Show notification toast
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `studybot-notification studybot-notification-${type}`;
    notification.textContent = message;

    // Only show notification if document.body is ready
    if (document.body) {
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('show');
      }, 10);

      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    } else {
      console.log('[StudyBot]', message); // Fallback to console log
    }
  }
}

// Initialize content extractor
const extractor = new ContentExtractor();
