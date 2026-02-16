// StudyBot Service Worker (Manifest V3)

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  // Create context menus
  chrome.contextMenus.create({
    id: 'studybot-extract',
    title: 'Generate study materials',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'studybot-selection',
    title: 'StudyBot: Create from selection',
    contexts: ['selection']
  });

  // Initialize storage
  chrome.storage.sync.get(['studybot_settings'], (result) => {
    if (!result.studybot_settings) {
      chrome.storage.sync.set({
        studybot_settings: {
          darkMode: true,
          aiDetailLevel: 'standard',
          notifications: true,
          initialized: true,
        },
      });
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'studybot-extract') {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  } else if (info.menuItemId === 'studybot-selection') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractSelectedText',
      text: info.selectionText,
    });
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  }
});

// Handle messages from content scripts and popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractedContent') {
    // Store extracted content temporarily so sidepanel can access it even if opened after extraction
    chrome.storage.local.set({
      pendingExtractedContent: {
        content: request.content,
        url: request.url,
        title: request.title,
        wasTruncated: request.wasTruncated,
        isSelection: request.isSelection,
        timestamp: Date.now(),
      }
    }, () => {
      // Notify any listening sidepanels/popups
      try {
        chrome.runtime.sendMessage({
          action: 'extractedContentStored',
          data: request
        });
      } catch (e) {
        // Receiver may not exist yet, that's okay
      }
    });
    sendResponse({ received: true });
  } else if (request.action === 'openSidePanel') {
    if (chrome.sidePanel && chrome.sidePanel.open && sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
    }
    sendResponse({ success: true });
  } else if (request.action === 'getPageContent') {
    sendResponse({ received: true });
  }
  return true; // Keep channel open for async responses
});

// Listen for tab changes
chrome.tabs.onActivated.addListener(() => {
  // Tab context tracking for future features
});
